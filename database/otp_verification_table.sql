-- OTP Verification Table
-- Run this script in MySQL to create the OTP verification table

USE attendance_db;

-- OTP Verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobile_number VARCHAR(20) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mobile_number (mobile_number),
  INDEX idx_otp (otp),
  INDEX idx_is_verified (is_verified),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Reset table (for password reset functionality)
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_used (used),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add mobile_number and is_mobile_verified columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) NULL AFTER email,
ADD COLUMN IF NOT EXISTS is_mobile_verified BOOLEAN DEFAULT FALSE AFTER mobile_number,
ADD INDEX IF NOT EXISTS idx_mobile_number (mobile_number);

-- Add username, full_name, gender, date_of_birth, marital_status, profile_photo, preferences columns to users table if they don't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username VARCHAR(100) NULL AFTER name,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) NULL AFTER name,
ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'other') NULL AFTER username,
ADD COLUMN IF NOT EXISTS date_of_birth DATE NULL AFTER gender,
ADD COLUMN IF NOT EXISTS marital_status ENUM('single', 'married', 'divorced', 'widowed') NULL AFTER date_of_birth,
ADD COLUMN IF NOT EXISTS profile_photo TEXT NULL AFTER marital_status,
ADD COLUMN IF NOT EXISTS preferences JSON NULL AFTER profile_photo,
ADD INDEX IF NOT EXISTS idx_username (username);

-- Show table structures
DESCRIBE otp_verifications;
DESCRIBE password_resets;
DESCRIBE users;
