# Troubleshooting OTP Internal Server Error

## Common Issues

### 1. Database Not Connected
Check if your database is running and credentials are correct in `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=attendance_db
```

### 2. Missing `otp_verifications` Table
Run this SQL to create the table:
```sql
USE attendance_db;

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
```

Or run the migration file:
```bash
mysql -u root -p attendance_db < database/otp_verification_table.sql
```

### 3. Check Backend Logs
Look at your backend terminal output - it should show the actual error.

### 4. Test Database Connection
```bash
cd attendance-backend
node -e "require('dotenv').config(); const db = require('./db'); db.execute('SELECT 1').then(() => console.log('DB OK')).catch(e => console.error('DB Error:', e.message));"
```
