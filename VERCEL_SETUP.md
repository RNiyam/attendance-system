# ✅ Vercel Deployment - Quick Setup

## 🎯 Step-by-Step for Vercel

### 1. **GitHub Setup** (if not done)
```bash
git add .
git commit -m "Split repo into separate services"
git push origin main
```

### 2. **Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository

### 3. **Configure Project** ⚠️ CRITICAL

In Vercel project settings:

- **Framework Preset:** `Next.js` (auto-detected)
- **Root Directory:** `attendance-frontend` ⚠️ **MUST SET THIS**
- **Build Command:** `npm run build` (auto)
- **Output Directory:** `.next` (auto)
- **Install Command:** `npm install` (auto)

### 4. **Environment Variables**

Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app
```

⚠️ **Important:**
- Use `NEXT_PUBLIC_` prefix for client-side access
- Replace `your-backend-url.railway.app` with your actual backend URL
- Don't use `localhost` in production

### 5. **Deploy**

Click **"Deploy"** → Vercel will:
1. Install dependencies (`npm install`)
2. Build the app (`npm run build`)
3. Deploy to `https://your-app.vercel.app`

---

## ✅ After Deployment

### Test Your Frontend:
1. Visit `https://your-app.vercel.app`
2. Open browser DevTools → Network tab
3. Try logging in
4. Check API calls go to your backend (not localhost)

### If API calls fail:
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend CORS allows your Vercel domain
- Check backend is running and accessible

---

## 📋 Checklist Before Deploying

- [ ] Code pushed to GitHub
- [ ] Root Directory set to `attendance-backend` ❌ **NO!** Set to `attendance-frontend` ✅
- [ ] Environment variable `NEXT_PUBLIC_API_URL` added
- [ ] Backend is deployed and accessible
- [ ] Backend URL is correct (no localhost)

---

## 🔧 Troubleshooting

**"Module not found" errors:**
- Make sure Root Directory is `attendance-frontend`
- Check `package.json` exists in `attendance-frontend/`

**API calls return 404:**
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify backend is deployed and running
- Check backend CORS settings

**Build fails:**
- Check `npm install` works locally
- Check Node version (Vercel auto-detects)
- Check for TypeScript errors

---

## 🎉 That's It!

Your frontend is now deployed on Vercel!

Next steps:
1. Deploy backend to Railway/Render
2. Deploy Python service to Render/EC2
3. Set up database (PlanetScale/Railway/RDS)
4. Update `NEXT_PUBLIC_API_URL` if needed
