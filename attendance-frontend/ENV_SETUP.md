# Environment Variables Setup for Frontend

## For Local Development

Create a file `.env.local` in `attendance-frontend/` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Important:** `.env.local` is already in `.gitignore` and won't be committed.

---

## For Vercel Deployment

Add environment variables in Vercel Dashboard:

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://your-backend-url.railway.app` (your actual backend URL)
   - **Environments:** Select `Production`, `Preview`, and `Development`

---

## Available Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` (local)<br>`https://your-backend.railway.app` (production) |

---

## Notes

- Use `NEXT_PUBLIC_` prefix for client-side accessible variables in Next.js
- Never commit `.env.local` to git
- Always use HTTPS URLs in production
