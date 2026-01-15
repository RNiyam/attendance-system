# 🚀 How to Run the Face Recognition Attendance System

## Step-by-Step Instructions

### Step 1: Install & Start MySQL (if not already done)

```bash
# Install MySQL (if needed)
brew install mysql

# Start MySQL service
brew services start mysql

# Verify MySQL is running
mysql -u root -e "SELECT 1"
```

**If MySQL asks for a password**, you'll need to set it or use the password you configured.

### Step 2: Create the Database

```bash
cd /Users/apple/Test_Attendance
mysql -u root -p < database/setup.sql
```

**Or manually:**
```bash
mysql -u root -p
```
Then copy and paste the contents of `database/setup.sql`

### Step 3: Configure Backend Environment

```bash
cd backend
cp .env.example .env
# If .env.example doesn't exist, create .env manually with the content below
```

**Edit `.env` file** with your MySQL password:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=attendance_db
PORT=3001
FACE_SERVICE_URL=http://localhost:5000
```

### Step 4: Start All Services

You have **two options**:

#### Option A: Use the Startup Script (Easiest)

```bash
cd /Users/apple/Test_Attendance
./start.sh
```

This will start all 3 services automatically.

#### Option B: Start Manually (3 Terminal Windows)

**Terminal 1 - Python Face Service:**
```bash
cd /Users/apple/Test_Attendance/face-service
source venv/bin/activate
python app.py
```
You should see: `Starting Face Recognition Service on http://localhost:5000`

**Terminal 2 - Node.js Backend:**
```bash
cd /Users/apple/Test_Attendance/backend
npm install  # Only needed first time
npm start
```
You should see: `Backend server running on http://localhost:3001`

**Terminal 3 - Next.js Frontend:**
```bash
cd /Users/apple/Test_Attendance/frontend
npm install  # Only needed first time
npm run dev
```
You should see: `- Local: http://localhost:3000`

### Step 5: Open in Browser

Open your browser and go to: **http://localhost:3000**

## ✅ Verify Everything is Working

1. **Python Service:** http://localhost:5000/health
   - Should show: `{"status":"ok","service":"face-recognition"}`

2. **Backend API:** http://localhost:3001/health
   - Should show: `{"status":"ok","service":"attendance-backend"}`

3. **Frontend:** http://localhost:3000
   - Should show the attendance interface

## 🎯 First Use

1. **Register an Employee:**
   - Click the **"Register"** tab
   - Enter Employee Code: `EMP001`
   - Enter Name: `John Doe`
   - Click **"Start Camera"** (allow permissions)
   - Position your face in the camera
   - Click **"Register Employee"**

2. **Mark Attendance:**
   - Click the **"Check In/Out"** tab
   - Enter Employee Code: `EMP001`
   - Click **"Start Camera"**
   - Position your face in the camera
   - Click **"Mark Attendance"**

## 🐛 Troubleshooting

**MySQL not starting?**
```bash
brew services restart mysql
# or check status
brew services list
```

**Port already in use?**
- Python (5000): Change `PORT=5000` in `face-service/app.py`
- Backend (3001): Change `PORT=3001` in `backend/.env`
- Frontend (3000): Change port in `frontend/package.json` scripts

**Database connection error?**
- Check MySQL is running: `brew services list`
- Verify credentials in `backend/.env`
- Test connection: `mysql -u root -p`

**Camera not working?**
- Use Chrome or Firefox
- Check browser permissions
- Ensure HTTPS in production (localhost works for development)

**Face not detected?**
- Ensure good lighting
- Only one face in frame
- Face clearly visible and centered

## 📝 Quick Commands Reference

```bash
# Start MySQL
brew services start mysql

# Stop all services
# Press Ctrl+C in each terminal, or:
pkill -f "python app.py"
pkill -f "node server.js"
pkill -f "next dev"

# Check if services are running
lsof -i :5000  # Python
lsof -i :3001  # Backend
lsof -i :3000  # Frontend
```

---

**Need more help?** Check `README.md` for detailed documentation.
