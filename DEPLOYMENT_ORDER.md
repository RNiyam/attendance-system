# 📋 Deployment Order (Do This Sequence)

## ✅ Step 1: Frontend (DONE!)
- ✅ Deployed to Vercel
- ✅ URL: `https://attendance-system-baol.vercel.app`

---

## 🔄 Step 2: Database Setup (Do This First!)

Before deploying backend, set up your database:

### Option A: PlanetScale (Recommended - Free Tier)
1. Go to [planetscale.com](https://planetscale.com)
2. Create account → Create database
3. Get connection string
4. Run migrations:
   ```bash
   mysql -h your-host -u your-user -p attendance_db < attendance-backend/database/setup.sql
   mysql -h your-host -u your-user -p attendance_db < attendance-backend/database/otp_verification_table_compatible.sql
   ```

### Option B: Railway MySQL
1. In Railway, add **MySQL** service
2. Get connection details from Railway dashboard
3. Run migrations using Railway's MySQL console

### Option C: Keep Local MySQL (For Testing)
- Use your local MySQL for now
- Update backend env vars with local DB credentials

---

## 🚀 Step 3: Deploy Python Face Service

**Why first?** Because backend needs its URL.

1. Deploy to Render (see `PYTHON_DEPLOY_RENDER.md`)
2. Get Python service URL: `https://your-service.onrender.com`
3. Test: `curl https://your-service.onrender.com/health`

---

## 🔧 Step 4: Deploy Backend

1. Deploy to Railway (see `BACKEND_DEPLOY_RAILWAY.md`)
2. Set `FACE_SERVICE_URL` = Python service URL from Step 3
3. Set database credentials from Step 2
4. Get backend URL: `https://your-backend.up.railway.app`
5. Test: `curl https://your-backend.up.railway.app/health`

---

## 🔗 Step 5: Connect Everything

1. **Update Frontend (Vercel):**
   - Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` = Backend URL from Step 4
   - Redeploy

2. **Update Backend CORS:**
   - Make sure backend allows your Vercel domain
   - Check `attendance-backend/server.js` - CORS settings

---

## ✅ Final Checklist

- [ ] Database created and migrations run
- [ ] Python service deployed and tested
- [ ] Backend deployed with Python URL and DB credentials
- [ ] Frontend updated with backend URL
- [ ] All services tested and working

---

## 🧪 Test Everything

1. **Frontend:** Visit `https://attendance-system-baol.vercel.app`
2. **Backend:** `curl https://your-backend.up.railway.app/health`
3. **Python:** `curl https://your-service.onrender.com/health`
4. **Full Flow:** Try login/onboarding on frontend

---

## 📝 Quick Reference

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | `https://attendance-system-baol.vercel.app` |
| Backend | Railway | `https://your-backend.up.railway.app` |
| Python | Render | `https://your-service.onrender.com` |
| Database | PlanetScale/Railway | (private) |
