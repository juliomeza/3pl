-- ALTER TABLE script to add missing columns to existing portal_orders table
-- Run this script to add the new columns for owner_lookupcode and project_lookupcode

-- Add owner_lookupcode column
ALTER TABLE portal_orders 
ADD COLUMN owner_lookupcode VARCHAR(100);

-- Add project_lookupcode column  
ALTER TABLE portal_orders 
ADD COLUMN project_lookupcode VARCHAR(100);

-- Add comments for the new columns
COMMENT ON COLUMN portal_orders.owner_lookupcode IS 'Owner lookup code from wms_owners.lookupcode';
COMMENT ON COLUMN portal_orders.project_lookupcode IS 'Project lookup code from wms_projects.lookupcode';

-- Optionally, if you want to populate existing records with the lookup codes:
-- (Only run this if you have existing data in portal_orders that needs to be updated)

-- UPDATE portal_orders SET 
--   owner_lookupcode = (
--     SELECT o.lookupcode 
--     FROM wms_owners o 
--     WHERE o.id = portal_orders.owner_id
--   ),
--   project_lookupcode = (
--     SELECT p.lookupcode 
--     FROM wms_projects p 
--     WHERE p.id::varchar = portal_orders.project_id
--   )
-- WHERE owner_lookupcode IS NULL OR project_lookupcode IS NULL;