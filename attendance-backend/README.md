# Attendance Backend API

Node.js/Express backend for the Face Recognition Attendance System.

## Environment Variables

Create a `.env` file with:

```
PORT=3001
NODE_ENV=production

# Database
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name

# Face Service (Python)
FACE_SERVICE_URL=http://localhost:5000

# JWT
JWT_SECRET=your-jwt-secret-key

# OTP Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Installation

```bash
npm install
```

## Run

```bash
npm start
```

For development:
```bash
npm run dev
```

## Deployment

Deploy to Railway, Render, or similar platform. Set environment variables in the platform dashboard.
