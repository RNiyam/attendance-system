# Environment Variables Guide

This document explains all environment variables needed for each service.

---

## 📁 Frontend (`attendance-frontend/`)

### File: `env.example` → Copy to `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**For Local Development:**
1. Copy `env.example` to `.env.local`
2. Update `NEXT_PUBLIC_API_URL` if your backend runs on a different port

**For Vercel:**
- Add `NEXT_PUBLIC_API_URL` in Vercel Dashboard → Settings → Environment Variables
- Use your production backend URL (e.g., `https://your-backend.railway.app`)

---

## 🔧 Backend (`attendance-backend/`)

### File: `env.example` → Copy to `.env`

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-database-password
DB_NAME=attendance_db

# Face Recognition Service (Python)
FACE_SERVICE_URL=http://localhost:5000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# OTP Service (Qikberry - Optional)
QIKBERRY_API_KEY=your-qikberry-api-key
QIKBERRY_SENDER=QBERRY
QIKBERRY_TEMPLATE_ID=your-template-id
```

**For Local Development:**
1. Copy `env.example` to `.env`
2. Update all values with your actual credentials

**For Production (Railway/Render):**
- Set all these variables in your platform's environment variables section
- Use production URLs (not localhost)

---

## 🐍 Python Face Service (`attendance-face-service/`)

### File: `env.example` → Copy to `.env`

```env
# Server Configuration
PORT=5000
FLASK_ENV=development
```

**For Local Development:**
1. Copy `env.example` to `.env`
2. Update `PORT` if needed (default: 5000)

**For Production (Render/EC2):**
- Set `PORT=5000` (or your platform's assigned port)
- Set `FLASK_ENV=production`

**Note:** This service does NOT need database credentials - it only processes face recognition.

---

## ✅ Quick Setup Commands

### Frontend:
```bash
cd attendance-frontend
cp env.example .env.local
# Edit .env.local with your values
```

### Backend:
```bash
cd attendance-backend
cp env.example .env
# Edit .env with your actual database and service URLs
```

### Python Service:
```bash
cd attendance-face-service
cp env.example .env
# Edit .env if needed (usually defaults are fine)
```

---

## 🔒 Security Notes

- **Never commit `.env` or `.env.local` files** (already in `.gitignore`)
- **Always use `env.example` files** as templates
- **Use strong secrets** for `JWT_SECRET` in production
- **Use HTTPS URLs** in production (not `http://localhost`)

---

## 📋 Checklist Before Deployment

- [ ] Frontend: `.env.local` created (local) or Vercel env vars set (production)
- [ ] Backend: `.env` created (local) or platform env vars set (production)
- [ ] Python: `.env` created (local) or platform env vars set (production)
- [ ] All `localhost` URLs replaced with production URLs
- [ ] Database credentials are correct
- [ ] JWT_SECRET is strong and unique
