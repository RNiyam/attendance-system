-- Make email nullable in users table for mobile-only signups
-- Run this script in MySQL

USE attendance_db;

-- Modify email column to allow NULL
-- Note: UNIQUE constraint with NULL values works in MySQL (NULL != NULL, so multiple NULLs are allowed)
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL;

-- Also make password nullable for mobile-only signups
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

-- Verify the changes
DESCRIBE users;
