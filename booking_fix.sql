-- ============================================================
-- Booking migration: maps local columns → Docker/Hibernate columns
-- Skips: `status` (old), `payment_id` (old) — not in new schema
-- ============================================================

DELETE FROM booking_traveller_names;
DELETE FROM booking;

INSERT INTO booking
  (id, days, destination, paid_amount, payment_status, people,
   total_amount, user_email, booking_status, full_paid,
   start_date, travel_status, booked_slots, end_date,
   total_slots, package_id, is_custom)
VALUES
(1,  17, 'Goa',               20000, 'PARTIAL', 2,  22000,  'arya@gmail.com',        'CANCELLED',  0, NULL,         'ONGOING',     0,  NULL,         0,  NULL, 0),
(2,   7, 'Goa',                3000, 'PARTIAL', 2,  12000,  'arya@gmail.com',        NULL,         0, NULL,         'NOT_STARTED', 0,  NULL,         0,  NULL, 0),
(3,   7, 'Dubai',             22000, 'FULL',    2,  22000,  'arya@gmail.com',        'CONFIRMED',  1, NULL,         'NOT_STARTED', 0,  NULL,         0,  NULL, 0),
(4,   7, 'Goa',               10000, 'PARTIAL', 2,  12000,  'aryashlok55@gmail.com', 'CANCELLED',  0, NULL,         'NOT_STARTED', -4, NULL,         0,  NULL, 0),
(5,   9, 'Goa',                3000, 'PARTIAL', 2,  10000,  'arya@gmail.com',        'CONFIRMED',  0, NULL,         'NOT_STARTED', 0,  NULL,         0,  NULL, 0),
(6,   5, 'Goa',               10000, 'FULL',    2,  10000,  'aryashlok55@gmail.com', 'CONFIRMED',  1, '2026-05-28', 'NOT_STARTED', 1,  '2026-06-02', 15, NULL, 0),
(7,   7, 'Singapore Premium', 75000, 'PARTIAL', 1, 250000,  'aryashlok55@gmail.com', 'CANCELLED',  0, '2026-05-01', 'ONGOING',     1,  '2026-05-08', 15, NULL, 0),
(8,   5, 'Goa Package',        3000, 'PARTIAL', 1,  10000,  'Shayam@gmail.com',      'CONFIRMED',  0, '2026-05-02', 'COMPLETED',   0,  '2026-05-06', 15, 1,    0),
(9,   5, 'Arunachal Pradesh',  1500, 'PARTIAL', 1,   5000,  'peter@gmail.com',       'CONFIRMED',  0, '2026-05-03', 'COMPLETED',   0,  '2026-05-07', 15, 12,   0),
(10,  5, 'Goa Premium',        4500, 'PARTIAL', 1,  15000,  'aryashlok55@gmail.com', 'CONFIRMED',  0, '2026-05-06', 'COMPLETED',   0,  '2026-05-10', 15, 2,    0),
(11,  5, 'Goa Package',        6000, 'PARTIAL', 2,  20000,  'Ram@gmail.com',         'CONFIRMED',  0, '2026-05-06', 'COMPLETED',   0,  '2026-05-10', 15, 1,    0),
(12,  6, 'Jharkhand',          4500, 'PARTIAL', 1,  15000,  'Ram@gmail.com',         'CONFIRMED',  0, '2026-05-06', 'COMPLETED',   0,  '2026-05-11', 15, 13,   0),
(13,  5, 'Kerala',             4500, 'PARTIAL', 1,  15000,  'Shayam@gmail.com',      'CONFIRMED',  0, '2026-05-07', 'COMPLETED',   0,  '2026-05-11', 15, 14,   0),
(14,  5, 'Goa Package',        3000, 'PARTIAL', 1,  10000,  'Shayam@gmail.com',      'CONFIRMED',  0, '2026-05-07', 'COMPLETED',   0,  '2026-05-11', 15, 1,    0),
(15,  8, 'Goa',                4500, 'PARTIAL', 1,  15000,  'aryashlok55@gmail.com', 'CONFIRMED',  0, '2026-05-09', 'ONGOING',     0,  '2026-05-16', 15, 15,   0);

-- Traveller names
INSERT INTO booking_traveller_names (booking_id, traveller_names) VALUES
(6,  'Arya'),
(6,  'Abhishek'),
(7,  ''),
(8,  'shayam'),
(9,  'Peter'),
(10, 'Arya'),
(11, 'Ram'),
(11, 'Ram'),
(12, 'Ram'),
(13, 'aa'),
(14, 'aa'),
(15, 'Arya');
