-- Atomic stock decrement function
-- Decrements stock only if enough is available, preventing race conditions
CREATE OR REPLACE FUNCTION decrement_variant_stock(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INT DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INT;
BEGIN
    UPDATE product_variants
    SET stock = stock - p_quantity
    WHERE product_id = p_product_id
      AND size = p_size
      AND stock >= p_quantity;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Atomic stock increment function
-- Used for returns/cancellations
CREATE OR REPLACE FUNCTION increment_variant_stock(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INT DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INT;
BEGIN
    UPDATE product_variants
    SET stock = stock + p_quantity
    WHERE product_id = p_product_id
      AND size = p_size;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;
