-- ALTER TABLE portal_orders to add separate name fields
-- This script adds individual name fields to replace the single name fields

-- Add recipient name fields
ALTER TABLE portal_orders ADD COLUMN recipient_title VARCHAR(10);
ALTER TABLE portal_orders ADD COLUMN recipient_first_name VARCHAR(100);
ALTER TABLE portal_orders ADD COLUMN recipient_last_name VARCHAR(100);
ALTER TABLE portal_orders ADD COLUMN recipient_company_name VARCHAR(255);

-- Add billing name fields
ALTER TABLE portal_orders ADD COLUMN billing_title VARCHAR(10);
ALTER TABLE portal_orders ADD COLUMN billing_first_name VARCHAR(100);
ALTER TABLE portal_orders ADD COLUMN billing_last_name VARCHAR(100);
ALTER TABLE portal_orders ADD COLUMN billing_company_name VARCHAR(255);

-- Optional: Add comments to document the new fields
COMMENT ON COLUMN portal_orders.recipient_title IS 'Recipient title (Mr, Mrs, Ms, Dr, etc.)';
COMMENT ON COLUMN portal_orders.recipient_first_name IS 'Recipient first name';
COMMENT ON COLUMN portal_orders.recipient_last_name IS 'Recipient last name';
COMMENT ON COLUMN portal_orders.recipient_company_name IS 'Recipient company name (optional)';

COMMENT ON COLUMN portal_orders.billing_title IS 'Billing contact title (Mr, Mrs, Ms, Dr, etc.)';
COMMENT ON COLUMN portal_orders.billing_first_name IS 'Billing contact first name';
COMMENT ON COLUMN portal_orders.billing_last_name IS 'Billing contact last name';
COMMENT ON COLUMN portal_orders.billing_company_name IS 'Billing company name (optional)';

-- Verify the new columns were added
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns 
WHERE table_name = 'portal_orders' 
AND column_name LIKE '%recipient_%' OR column_name LIKE '%billing_%'
ORDER BY column_name;