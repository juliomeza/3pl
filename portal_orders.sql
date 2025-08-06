-- Create portal_orders table for storing order header information
-- This table stores the main order data including addresses, carrier info, and order status
-- Used by external system to generate CSV/JSON exports for submitted orders

CREATE TABLE portal_orders (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Order Identification
    order_number VARCHAR(50),
    reference_number VARCHAR(100),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Order Classification
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('inbound', 'outbound')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'created')),
    
    -- Client and Project Information
    owner_id INTEGER NOT NULL,  -- Links to client ownership for data filtering
    owner_lookupcode VARCHAR(100), -- Owner lookup code from wms_owners
    project_id VARCHAR(50),
    project_lookupcode VARCHAR(100), -- Project lookup code from wms_projects
    
    -- Shipment Information
    shipment_number VARCHAR(100),
    estimated_delivery_date DATE,
    
    -- Recipient/Shipping Address Information
    recipient_name VARCHAR(255),
    addr1 VARCHAR(255),
    addr2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(10),
    zip VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    territory VARCHAR(100),
    
    -- Billing Account Information
    account_name VARCHAR(255),
    billing_addr1 VARCHAR(255),
    billing_addr2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(10),
    billing_zip VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'United States',
    
    -- Contact Information
    contact_lookup VARCHAR(100),
    title VARCHAR(50),
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(255),
    fax VARCHAR(30),
    
    -- Carrier Information
    carrier VARCHAR(100),
    service_type VARCHAR(100),
    carrier_id VARCHAR(50),
    service_type_id VARCHAR(50),
    
    -- License and Compliance Information
    state_lic VARCHAR(100),
    state_of_licensur VARCHAR(100),
    state_lic_exp DATE,
    dea_number VARCHAR(50),
    dea_exp DATE,
    me VARCHAR(10), -- Medical Examiner flag or similar
    
    -- Additional Information
    notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Add indexes for common query patterns
CREATE INDEX idx_portal_orders_owner_id ON portal_orders (owner_id);
CREATE INDEX idx_portal_orders_status ON portal_orders (status);
CREATE INDEX idx_portal_orders_order_date ON portal_orders (order_date);
CREATE INDEX idx_portal_orders_owner_status ON portal_orders (owner_id, status);
CREATE INDEX idx_portal_orders_order_number ON portal_orders (order_number);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portal_orders_updated_at 
    BEFORE UPDATE ON portal_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE portal_orders IS 'Main table for storing order header information. Orders in submitted status are processed by external system.';
COMMENT ON COLUMN portal_orders.owner_id IS 'Client identifier for data filtering and access control';
COMMENT ON COLUMN portal_orders.status IS 'Order status: draft (editable), submitted (ready for processing), created (processed by external system)';
COMMENT ON COLUMN portal_orders.order_type IS 'Type of order: inbound (purchase order) or outbound (sales order)';