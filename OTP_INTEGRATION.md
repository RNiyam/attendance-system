# OTP Verification Integration Guide

## Overview
OTP (One-Time Password) verification has been successfully integrated into your attendance system. This allows users to register and login using mobile numbers with SMS-based OTP verification.

## What Was Added

### 1. New Files Created

#### Controllers
- `backend/controllers/otpController.js` - Handles OTP sending and verification
- `backend/controllers/profileController.js` - Manages user profiles with OTP support

#### Routes
- `backend/routes/otpRoutes.js` - OTP API endpoints
- `backend/routes/profileRoutes.js` - Profile management endpoints

#### Database Migration
- `database/otp_verification_table.sql` - Creates OTP verification and password reset tables

### 2. Updated Files

- `backend/controllers/authController.js` - Updated to support OTP-based registration and login
- `backend/routes/authRoutes.js` - Added password reset routes
- `backend/server.js` - Added OTP and profile routes
- `backend/package.json` - Added dependencies: `moment`, `express-validator`, `nodemailer`

## Installation Steps

### Step 1: Install Dependencies
```bash
cd backend
npm install moment express-validator nodemailer
```

### Step 2: Run Database Migration
```bash
mysql -u root -p attendance_db < database/otp_verification_table.sql
```

Or manually run the SQL file in your MySQL client.

### Step 3: Configure Environment Variables

Add these to your `backend/.env` file:

```env
# Qikberry SMS Service (for OTP)
QIKBERRY_API_KEY=e88cb7d9372c05cd652d3a3a17db6075
QIKBERRY_SENDER=QBERRY
QIKBERRY_TEMPLATE_ID=1707161528616464235

# SMTP Configuration (for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### OTP Endpoints

#### Send OTP
```
POST /api/otp/send
Body: {
  "mobileNumber": "1234567890"  // 10-digit mobile number
}
```

#### Verify OTP
```
POST /api/otp/verify
Body: {
  "mobileNumber": "1234567890",
  "otp": "1234"  // 4-digit OTP
}
```

### Authentication Endpoints (Updated)

#### Signup with OTP
```
POST /api/auth/signup
Body: {
  "name": "John Doe",
  "mobileNumber": "1234567890",  // Requires verified OTP
  "email": "john@example.com",   // Optional
  "password": "password123"       // Required if email provided
}
```

#### Login with OTP
```
POST /api/auth/login
Body: {
  "mobileNumber": "1234567890",  // Requires verified OTP
  "email": "john@example.com",    // Alternative: requires password
  "password": "password123"        // Required if email provided
}
```

#### Request Password Reset
```
POST /api/auth/password-reset/request
Body: {
  "email": "john@example.com"
}
```

#### Reset Password
```
POST /api/auth/password-reset/reset
Body: {
  "token": "reset-token-from-email",
  "newPassword": "newpassword123"
}
```

### Profile Endpoints

#### Get Profile
```
GET /api/profile
Headers: Authorization: Bearer <token>
```

#### Update Profile
```
PUT /api/profile
Headers: Authorization: Bearer <token>
Body: {
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "username": "johndoe",
  "gender": "male",
  "dateOfBirth": "1990-01-01",
  "maritalStatus": "single",
  "otp": "1234"  // Required if phone is being updated and not verified
}
```

#### Get Preferences
```
GET /api/profile/preferences
Headers: Authorization: Bearer <token>
```

#### Update Preferences
```
PUT /api/profile/preferences
Headers: Authorization: Bearer <token>
Body: {
  "showHoursChart": true,
  "showCheckInOutChart": true,
  "showStatistics": true
}
```

#### Change Password
```
POST /api/profile/change-password
Headers: Authorization: Bearer <token>
Body: {
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

## Usage Flow

### Mobile Number Registration Flow

1. User enters mobile number
2. Frontend calls `POST /api/otp/send` with mobile number
3. OTP is sent via SMS (Qikberry)
4. User enters OTP
5. Frontend calls `POST /api/otp/verify` with mobile number and OTP
6. If verified, frontend calls `POST /api/auth/signup` with name and mobile number
7. User is registered and receives JWT token

### Mobile Number Login Flow

1. User enters mobile number
2. Frontend calls `POST /api/otp/send` with mobile number
3. OTP is sent via SMS
4. User enters OTP
5. Frontend calls `POST /api/otp/verify` with mobile number and OTP
6. If verified, frontend calls `POST /api/auth/login` with mobile number
7. User receives JWT token

### Email Login Flow (Unchanged)

1. User enters email and password
2. Frontend calls `POST /api/auth/login` with email and password
3. User receives JWT token

## Security Features

1. **OTP Expiration**: OTPs expire after 1 minute
2. **Rate Limiting**: Maximum 5 OTP requests per hour per mobile number
3. **OTP Verification Window**: Verified OTPs are valid for 5 minutes for registration/login
4. **Password Reset Token**: Tokens expire after 1 hour
5. **Password Hashing**: All passwords are hashed using bcrypt

## Database Schema

### otp_verifications Table
- `id` - Primary key
- `mobile_number` - Mobile number (indexed)
- `otp` - OTP code (indexed)
- `is_verified` - Verification status (indexed)
- `expires_at` - Expiration timestamp (indexed)
- `verified_at` - Verification timestamp
- `created_at` - Creation timestamp (indexed)

### password_resets Table
- `id` - Primary key
- `email` - User email (indexed)
- `token` - Reset token (indexed)
- `used` - Whether token has been used (indexed)
- `expires_at` - Expiration timestamp (indexed)
- `created_at` - Creation timestamp

### users Table (Updated)
Added columns:
- `mobile_number` - Mobile number (indexed)
- `is_mobile_verified` - Mobile verification status
- `username` - Username (indexed)
- `full_name` - Full name
- `gender` - Gender enum
- `date_of_birth` - Date of birth
- `marital_status` - Marital status enum
- `profile_photo` - Profile photo URL
- `preferences` - JSON preferences

## Testing

### Test OTP Flow
```bash
# 1. Send OTP
curl -X POST http://localhost:3001/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "1234567890"}'

# 2. Verify OTP (use OTP received via SMS)
curl -X POST http://localhost:3001/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "1234567890", "otp": "1234"}'

# 3. Register with verified OTP
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "mobileNumber": "1234567890"}'
```

## Notes

- The OTP service uses Qikberry SMS API. Make sure your API key is valid.
- Password reset emails require SMTP configuration.
- OTP verification is required for mobile number-based registration and login.
- Email-based registration/login still works without OTP (requires password).
