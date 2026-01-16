# 🚀 Deployment Guide

This repo is split into **3 separate services** for independent deployment.

---

## 📁 Project Structure

```
Test_Attendance/
├── attendance-frontend/     → Deploy to Vercel
├── attendance-backend/       → Deploy to Railway/Render
└── attendance-face-service/  → Deploy to Render/EC2
```

---

## 1️⃣ Frontend (Vercel)

### Setup

1. **Push to GitHub** (if not already done)

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repo

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `attendance-frontend` ⚠️ **IMPORTANT**
   - **Build Command:** `npm run build` (auto)
   - **Output Directory:** `.next` (auto)

4. **Add Environment Variable:**
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app`
   - ⚠️ Use `NEXT_PUBLIC_` prefix for client-side access

5. **Deploy** → Vercel will auto-deploy

### Verify

After deployment, check:
- ✅ Frontend loads at `https://your-app.vercel.app`
- ✅ API calls go to your backend (check network tab)

---

## 2️⃣ Backend (Railway / Render)

### Option A: Railway

1. **Create Railway Account** → [railway.app](https://railway.app)

2. **New Project:**
   - "Deploy from GitHub repo"
   - Select your repo
   - Select `attendance-backend` folder

3. **Set Environment Variables:**
   ```
   PORT=3001
   NODE_ENV=production
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=your-db-name
   FACE_SERVICE_URL=https://your-python-service.onrender.com
   JWT_SECRET=your-secret-key
   ```

4. **Deploy** → Railway auto-deploys

5. **Get Backend URL:**
   - Copy the public URL (e.g., `https://your-backend.up.railway.app`)
   - Use this in frontend's `NEXT_PUBLIC_API_URL`

### Option B: Render

1. **Create Render Account** → [render.com](https://render.com)

2. **New Web Service:**
   - Connect GitHub repo
   - **Root Directory:** `attendance-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

3. **Set Environment Variables:** (same as Railway)

4. **Deploy**

---

## 3️⃣ Python Face Service (Render / EC2)

### Option A: Render

1. **New Web Service:**
   - Connect GitHub repo
   - **Root Directory:** `attendance-face-service`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python app.py`

2. **Set Environment Variables:**
   ```
   PORT=5000
   FLASK_ENV=production
   ```

3. **Deploy** → Get public URL

4. **Update Backend:**
   - Set `FACE_SERVICE_URL` in backend env vars to this URL

### Option B: EC2 (Advanced)

1. **Launch EC2 Instance** (Ubuntu)

2. **SSH into server:**
   ```bash
   ssh -i key.pem ubuntu@your-ec2-ip
   ```

3. **Install Python & dependencies:**
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-venv
   git clone your-repo
   cd attendance-face-service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Run with PM2:**
   ```bash
   sudo npm install -g pm2
   pm2 start app.py --name face-service --interpreter python3
   pm2 save
   ```

5. **Configure Security Group:**
   - Allow inbound traffic on port 5000

6. **Get Public IP** → Use in backend's `FACE_SERVICE_URL`

---

## 4️⃣ Database (PlanetScale / Railway / AWS RDS)

### Option A: PlanetScale (Recommended)

1. **Create Account** → [planetscale.com](https://planetscale.com)

2. **Create Database:**
   - Give it a name
   - Get connection string

3. **Run Migrations:**
   - Use SQL files from `attendance-backend/database/`
   - Run `setup.sql` first, then others

4. **Get Credentials:**
   ```
   DB_HOST=your-host.planetscale.com
   DB_USER=your-user
   DB_PASSWORD=your-password
   DB_NAME=your-db-name
   ```

### Option B: Railway MySQL

1. **Add MySQL Service** to your Railway project
2. **Get connection details** from Railway dashboard
3. **Run SQL migrations**

---

## ✅ Deployment Order

1. **Database** → Set up first
2. **Python Service** → Deploy and get URL
3. **Backend** → Deploy with Python URL and DB credentials
4. **Frontend** → Deploy with Backend URL

---

## 🔗 Service URLs Example

After deployment, you'll have:

```
Frontend:  https://your-app.vercel.app
Backend:   https://your-backend.railway.app
Python:    https://your-python.onrender.com
Database:  (private, only backend connects)
```

---

## 🧪 Testing After Deployment

1. **Frontend Health:**
   - Visit `https://your-app.vercel.app`
   - Should load without errors

2. **Backend Health:**
   - Visit `https://your-backend.railway.app/health`
   - Should return `{"status":"ok"}`

3. **Python Health:**
   - Visit `https://your-python.onrender.com/health`
   - Should return `{"status":"ok"}`

4. **Full Flow:**
   - Login via frontend
   - Onboarding with face capture
   - Attendance check-in

---

## ⚠️ Common Issues

**Frontend can't reach backend:**
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Check backend CORS settings allow your Vercel domain

**Backend can't reach Python:**
- Check `FACE_SERVICE_URL` is correct
- Check Python service is running and healthy

**Database connection fails:**
- Verify all DB credentials are correct
- Check database allows connections from your backend host

---

## 📝 Notes

- **No localhost URLs** in production configs
- Each service is **independent** - deploy separately
- **Environment variables** are key - double-check them
- Use **HTTPS URLs** in production
