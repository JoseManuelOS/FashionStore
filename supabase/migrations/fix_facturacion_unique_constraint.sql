-- Migration: Remove unique constraint on facturacion.order_id
-- This allows both an original invoice AND a credit note (factura rectificativa) for the same order
-- Previously, creating a credit note would fail with: duplicate key value violates unique constraint "unique_order_facturacion"

-- Drop the unique constraint
ALTER TABLE facturacion DROP CONSTRAINT IF EXISTS unique_order_facturacion;

-- The regular index for querying by order_id remains:
CREATE INDEX IF NOT EXISTS idx_facturacion_order_id ON facturacion(order_id);
