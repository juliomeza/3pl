-- Create portal_order_lines table for storing individual line items (materials) of orders
-- This table stores the material details for each order line
-- Each order can have multiple line items (materials with quantities, lots, license plates)

CREATE TABLE portal_order_lines (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Foreign Key to portal_orders
    order_id INTEGER NOT NULL REFERENCES portal_orders(id) ON DELETE CASCADE,
    
    -- Line Item Information
    line_number INTEGER NOT NULL DEFAULT 1,
    
    -- Material Information
    material_code VARCHAR(100) NOT NULL,
    material_description TEXT,
    quantity NUMERIC(15,4) NOT NULL CHECK (quantity > 0),
    uom VARCHAR(20) NOT NULL, -- Unit of Measure
    
    -- Lot and License Plate Information
    lot VARCHAR(100),
    license_plate VARCHAR(100),
    serial_number VARCHAR(100),
    batch_number VARCHAR(100),
    
    -- Additional Material Details
    material_notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- Ensure line numbers are unique within each order
    UNIQUE (order_id, line_number)
);

-- Add indexes for common query patterns
CREATE INDEX idx_portal_order_lines_order_id ON portal_order_lines (order_id);
CREATE INDEX idx_portal_order_lines_material_code ON portal_order_lines (material_code);
CREATE INDEX idx_portal_order_lines_lot ON portal_order_lines (lot);
CREATE INDEX idx_portal_order_lines_license_plate ON portal_order_lines (license_plate);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_portal_order_lines_updated_at 
    BEFORE UPDATE ON portal_order_lines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to automatically set line_number based on order
CREATE OR REPLACE FUNCTION set_line_number()
RETURNS TRIGGER AS $$
BEGIN
    -- If line_number is not provided, auto-increment within the order
    IF NEW.line_number IS NULL OR NEW.line_number = 0 THEN
        SELECT COALESCE(MAX(line_number), 0) + 1 
        INTO NEW.line_number 
        FROM portal_order_lines 
        WHERE order_id = NEW.order_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_portal_order_lines_line_number 
    BEFORE INSERT ON portal_order_lines 
    FOR EACH ROW 
    EXECUTE FUNCTION set_line_number();

-- Comments for documentation
COMMENT ON TABLE portal_order_lines IS 'Line items (materials) for each order in portal_orders table';
COMMENT ON COLUMN portal_order_lines.order_id IS 'Foreign key reference to portal_orders.id';
COMMENT ON COLUMN portal_order_lines.line_number IS 'Sequential line number within each order (auto-generated if not provided)';
COMMENT ON COLUMN portal_order_lines.material_code IS 'Material identifier code';
COMMENT ON COLUMN portal_order_lines.quantity IS 'Quantity of material for this line item';
COMMENT ON COLUMN portal_order_lines.uom IS 'Unit of measure (EA, LB, KG, etc.)';
COMMENT ON COLUMN portal_order_lines.lot IS 'Lot number for material traceability';
COMMENT ON COLUMN portal_order_lines.license_plate IS 'License plate/container identifier for warehouse tracking';