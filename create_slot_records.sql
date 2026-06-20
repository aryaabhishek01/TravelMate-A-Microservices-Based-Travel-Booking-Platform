USE travelmate_trip;

CREATE TABLE IF NOT EXISTS slot_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    package_id BIGINT NOT NULL,
    `year_month` VARCHAR(7) NOT NULL,
    booked_count INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_pkg_month (package_id, `year_month`)
);

SHOW TABLES;
