# Database Migration Instructions

## Running the OTP Verification Migration

Since MySQL is not in your system PATH, you have a few options to run the migration:

### Option 1: Using MySQL Command Line (Recommended)

If MySQL is installed but not in PATH, find the MySQL binary location:

**On macOS (if installed via Homebrew):**
```bash
/usr/local/mysql/bin/mysql -u root -p attendance_db < database/otp_verification_table_compatible.sql
```

**On macOS (if installed via MySQL installer):**
```bash
/usr/local/mysql/bin/mysql -u root -p attendance_db < database/otp_verification_table_compatible.sql
```

**On Linux:**
```bash
/usr/bin/mysql -u root -p attendance_db < database/otp_verification_table_compatible.sql
```

### Option 2: Using MySQL Workbench or phpMyAdmin

1. Open MySQL Workbench or phpMyAdmin
2. Connect to your MySQL server
3. Select the `attendance_db` database
4. Open the SQL file: `database/otp_verification_table_compatible.sql`
5. Execute the script

### Option 3: Using the Shell Script

Run the provided shell script:
```bash
cd /Users/apple/Test_Attendance
./database/run_otp_migration.sh
```

### Option 4: Manual Execution

If you prefer to run commands manually, connect to MySQL and run:

```bash
mysql -u root -p
```

Then execute:
```sql
USE attendance_db;
SOURCE database/otp_verification_table_compatible.sql;
```

## What the Migration Does

The migration script will:

1. **Create `otp_verifications` table** - Stores OTP codes for mobile verification
2. **Create `password_resets` table** - Stores password reset tokens
3. **Add columns to `users` table**:
   - `mobile_number` - User's mobile number
   - `is_mobile_verified` - Mobile verification status
   - `username` - Username
   - `full_name` - Full name
   - `gender` - Gender (male/female/other)
   - `date_of_birth` - Date of birth
   - `marital_status` - Marital status
   - `profile_photo` - Profile photo URL
   - `preferences` - User preferences (JSON)

## Verification

After running the migration, verify the tables were created:

```sql
SHOW TABLES;
DESCRIBE otp_verifications;
DESCRIBE password_resets;
DESCRIBE users;
```

You should see:
- `otp_verifications` table with columns: id, mobile_number, otp, is_verified, expires_at, verified_at, created_at
- `password_resets` table with columns: id, email, token, used, expires_at, created_at
- `users` table with the new columns added

## Notes

- The compatible version (`otp_verification_table_compatible.sql`) works with MySQL 5.7+
- The original version (`otp_verification_table.sql`) requires MySQL 8.0.13+ for `IF NOT EXISTS` syntax
- If you're using MySQL 8.0.13+, you can use either version
- The migration is idempotent - you can run it multiple times safely
