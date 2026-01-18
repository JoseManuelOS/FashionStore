-- =============================================
-- Stored Procedure: Cancelar Pedido con Restauración de Stock
-- Operación ATÓMICA: Si cualquier paso falla, se hace rollback completo
-- =============================================

-- Primero, creamos o reemplazamos la función
CREATE OR REPLACE FUNCTION cancel_order_with_stock_restore(order_id_param INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_status TEXT;
    order_item RECORD;
    items_restored INTEGER := 0;
    result JSONB;
BEGIN
    -- Paso 1: Verificar que el pedido existe y obtener su estado actual
    SELECT status INTO current_status
    FROM orders
    WHERE id = order_id_param
    FOR UPDATE; -- Lock la fila para evitar race conditions
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ORDER_NOT_FOUND',
            'message', 'El pedido no existe'
        );
    END IF;
    
    -- Paso 2: Verificar que el pedido está en estado 'paid' (no enviado aún)
    IF current_status != 'paid' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_STATUS',
            'message', 'Solo se pueden cancelar pedidos en estado "Pagado". Estado actual: ' || current_status,
            'current_status', current_status
        );
    END IF;
    
    -- Paso 3: Iterar sobre los items del pedido y restaurar stock
    FOR order_item IN 
        SELECT oi.product_id, oi.size, oi.quantity
        FROM order_items oi
        WHERE oi.order_id = order_id_param
    LOOP
        -- Restaurar stock en product_variants
        IF order_item.product_id IS NOT NULL AND order_item.size IS NOT NULL THEN
            UPDATE product_variants
            SET 
                stock = stock + order_item.quantity,
                updated_at = NOW()
            WHERE product_id = order_item.product_id
              AND size = order_item.size;
            
            -- También actualizar stock global en products (legacy support)
            UPDATE products
            SET stock = stock + order_item.quantity
            WHERE id = order_item.product_id;
            
            items_restored := items_restored + 1;
        END IF;
    END LOOP;
    
    -- Paso 4: Cambiar estado del pedido a 'cancelled'
    UPDATE orders
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE id = order_id_param;
    
    -- Paso 5: Retornar resultado exitoso
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Pedido cancelado correctamente',
        'order_id', order_id_param,
        'items_restored', items_restored,
        'previous_status', current_status
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- En caso de cualquier error, la transacción hace rollback automático
        RETURN jsonb_build_object(
            'success', false,
            'error', 'TRANSACTION_ERROR',
            'message', 'Error al procesar la cancelación: ' || SQLERRM
        );
END;
$$;

-- Dar permisos para que el service_role pueda ejecutar la función
GRANT EXECUTE ON FUNCTION cancel_order_with_stock_restore(INTEGER) TO service_role;

-- Comentario descriptivo
COMMENT ON FUNCTION cancel_order_with_stock_restore IS 
'Cancela un pedido de forma atómica: verifica estado, restaura stock en product_variants y products, y cambia estado a cancelled. Solo funciona para pedidos en estado paid.';
