# Attendance Frontend

Next.js frontend for the Face Recognition Attendance System.

## Environment Variables

For Vercel deployment, add in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

For local development, create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Installation

```bash
npm install
```

## Run

```bash
npm run dev
```

## Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set **Root Directory** to `attendance-frontend`
4. Add environment variable `NEXT_PUBLIC_API_URL`
5. Deploy

**Important:** Vercel will auto-detect Next.js. Make sure root directory is set correctly.
