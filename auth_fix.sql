-- Fix auth users: delete wrong data and re-insert with explicit column names
DELETE FROM users;

INSERT INTO users (id, email, name, password, role, otp, otpExpiry) VALUES
(2,  'admin@travelmate.com',  'Admin',  '$2a$10$d2WXNpTF.Av7m5l86s3A.OpiFTDzoi86stuQESwgbWBCSEPO7OSWO', 'ADMIN', NULL, NULL),
(6,  'aryashlok55@gmail.com', 'Arya',   '$2a$10$rBExBbRQpyrHhMu1AVsi.OtBYdWQUhAO.jPeXTxupkyIczHy/KjWC', 'USER',  NULL, NULL),
(9,  'shayam@gmail.com',      'Shayam', '$2a$10$LhEM4gJpB5nkX4QPC.SIveQAiwIEYIbJ0p1epFr4CF2nYj1JbWeii', 'USER',  NULL, NULL),
(10, '123@gmail.com',         'arya',   '$2a$10$Ii3iIZZLS.qyII.004fGE.jAaaGJ0xiotiXw/CDSRJ11gvh8edrPa', 'USER',  NULL, NULL),
(11, 'peter@gmail.com',       'Peter',  '$2a$10$TBmpKx3nYtLXwcyMc2kHEOKMcPau1CauRBx8DFORTu29aMCfw4VJO', 'USER',  NULL, NULL),
(12, 'Ram@gmail.com',         'Ram',    '$2a$10$eOGE0/GKsxRtQwITI24VzO.vlcZiEG4NWBXn/MXHWuA4oMlXdqriW', 'USER',  NULL, NULL);
