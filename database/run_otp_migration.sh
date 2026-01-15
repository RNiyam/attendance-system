#!/bin/bash

# OTP Verification Table Migration Script
# This script will create the OTP verification and password reset tables

echo "Running OTP verification table migration..."
echo "Please enter your MySQL root password when prompted"

mysql -u root -p attendance_db < "$(dirname "$0")/otp_verification_table.sql"

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Tables created:"
    echo "  - otp_verifications"
    echo "  - password_resets"
    echo ""
    echo "Columns added to users table:"
    echo "  - mobile_number"
    echo "  - is_mobile_verified"
    echo "  - username"
    echo "  - full_name"
    echo "  - gender"
    echo "  - date_of_birth"
    echo "  - marital_status"
    echo "  - profile_photo"
    echo "  - preferences"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
