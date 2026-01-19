-- Migration: Add invoice data fields to facturacion table
-- Run this in Supabase SQL Editor

-- Add new columns for storing invoice data
ALTER TABLE facturacion ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE facturacion ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE facturacion ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE facturacion ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE facturacion ADD COLUMN IF NOT EXISTS items JSONB; -- Array of invoice line items
ALTER TABLE facturacion ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2);
ALTER TABLE facturacion ADD COLUMN IF NOT EXISTS iva_amount NUMERIC(10, 2);
ALTER TABLE facturacion ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE facturacion ADD COLUMN IF NOT EXISTS total NUMERIC(10, 2);
ALTER TABLE facturacion ADD COLUMN IF NOT EXISTS pdf_url TEXT; -- Optional: URL to stored PDF

-- Create unique index for invoice_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_facturacion_invoice_number ON facturacion(invoice_number);

-- Create function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_prefix TEXT;
  next_seq INTEGER;
  invoice_num TEXT;
BEGIN
  year_prefix := to_char(NOW(), 'YYYY');
  
  -- Get the max sequence for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number LIKE year_prefix || '-%' 
      THEN CAST(SPLIT_PART(invoice_number, '-', 2) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_seq
  FROM facturacion;
  
  invoice_num := 'FM-' || year_prefix || '-' || LPAD(next_seq::TEXT, 6, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE facturacion IS 'Invoices generated for orders with full invoice data';
COMMENT ON COLUMN facturacion.invoice_number IS 'Human-readable invoice number (e.g., 2026-000001)';
COMMENT ON COLUMN facturacion.items IS 'JSON array of line items with product_name, quantity, price, size, total';
