-- Fix packages: delete wrong data and re-insert with explicit column names
DELETE FROM slot_records;
DELETE FROM itinerary;
DELETE FROM packages;

-- Re-insert with correct column mapping
INSERT INTO packages (id, name, duration, price, type, booked_slots, total_slots, destination_type, owner_email) VALUES
(1,  'Goa Package',       5,  10000,  'DEFAULT', 0, 15, 'NATIONAL',       NULL),
(2,  'Goa Premium',       5,  15000,  'DEFAULT', 0, 15, 'NATIONAL',       NULL),
(3,  'Dubai Trip',        5,  120000, 'DEFAULT', 0, 15, 'INTERNATIONAL',  NULL),
(4,  'Dubai Premium',     5,  200000, 'DEFAULT', 0, 15, 'INTERNATIONAL',  NULL),
(8,  'Chennai Trip',      5,  20000,  'DEFAULT', 0, 15, 'NATIONAL',       NULL),
(9,  'Singapore Premium', 7,  250000, 'DEFAULT', 0, 15, 'INTERNATIONAL',  NULL),
(11, 'Gujarat',           5,  8000,   'DEFAULT', 0, 15, 'NATIONAL',       NULL),
(12, 'Arunachal Pradesh Custom 5d', 5,  5000,  'CUSTOM', 0, 15, 'NATIONAL', 'peter@gmail.com'),
(13, 'Jharkhand Custom 6d',         6,  15000, 'CUSTOM', 0, 15, 'NATIONAL', 'Ram@gmail.com'),
(14, 'Kerala Custom 5d',            5,  15000, 'CUSTOM', 0, 15, 'NATIONAL', 'Shayam@gmail.com'),
(15, 'Goa Custom 8d',               8,  15000, 'CUSTOM', 0, 15, 'NATIONAL', 'aryashlok55@gmail.com');
