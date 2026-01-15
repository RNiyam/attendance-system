# 🚀 Quick Start Guide

Get your Face Recognition Attendance System running in 5 minutes!

## Prerequisites Check

- ✅ Python 3.8+ installed
- ✅ Node.js 18+ installed  
- ✅ MySQL installed and running
- ✅ Webcam available

## Step-by-Step Setup

### 1️⃣ Database Setup (2 minutes)

```bash
# Start MySQL (if not running)
brew services start mysql  # macOS
# or
sudo systemctl start mysql  # Linux

# Create database
mysql -u root -p < database/setup.sql
```

**Or manually:**
```bash
mysql -u root -p
```
Then paste:
```sql
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  face_embedding JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_id INT NOT NULL,
  status ENUM('IN','OUT') NOT NULL,
  confidence FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_id) REFERENCES employees(id)
);
```

### 2️⃣ Configure Backend (1 minute)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_db
PORT=3001
FACE_SERVICE_URL=http://localhost:5000
```

### 3️⃣ Start All Services (2 minutes)

**Option A: Use startup script (Easiest)**
```bash
# macOS/Linux
./start.sh

# Windows
start.bat
```

**Option B: Manual start (3 terminals)**

**Terminal 1 - Python Service:**
```bash
cd face-service
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt  # if not already installed
python app.py
```

**Terminal 2 - Node.js Backend:**
```bash
cd backend
npm install  # if first time
npm start
```

**Terminal 3 - Next.js Frontend:**
```bash
cd frontend
npm install  # if first time
npm run dev
```

### 4️⃣ Open Browser

Navigate to: **http://localhost:3000**

## 🎯 First Use

1. **Register an Employee:**
   - Click "Register" tab
   - Enter Employee Code: `EMP001`
   - Enter Name: `John Doe`
   - Click "Start Camera"
   - Allow camera permissions
   - Position face in camera
   - Click "Register Employee"

2. **Mark Attendance:**
   - Click "Check In/Out" tab
   - Enter Employee Code: `EMP001`
   - Click "Start Camera"
   - Position face in camera
   - Click "Mark Attendance"

## ✅ Verify Everything Works

1. **Python Service:** http://localhost:5000/health
   - Should return: `{"status":"ok","service":"face-recognition"}`

2. **Backend API:** http://localhost:3001/health
   - Should return: `{"status":"ok","service":"attendance-backend"}`

3. **Frontend:** http://localhost:3000
   - Should show the attendance interface

## 🐛 Common Issues

**Camera not working?**
- Use Chrome or Firefox
- Check browser permissions
- In production, HTTPS is required

**Database connection error?**
- Verify MySQL is running
- Check credentials in `backend/.env`
- Ensure database exists

**Face not detected?**
- Ensure good lighting
- Only one face in frame
- Face clearly visible

## 📚 Next Steps

- Read full documentation in `README.md`
- Customize face recognition threshold
- Add authentication
- Deploy to production

---

**Need help?** Check the main `README.md` for detailed documentation.
