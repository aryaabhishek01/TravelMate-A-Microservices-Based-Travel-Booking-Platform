-- This script runs automatically when the MySQL container first starts.
-- It creates the 3 databases needed by the microservices.
-- (travelmate_auth is already created by MYSQL_DATABASE env var)

CREATE DATABASE IF NOT EXISTS travelmate_trip;
CREATE DATABASE IF NOT EXISTS travelmate_booking;
