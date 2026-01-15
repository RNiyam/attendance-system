# Face Recognition Attendance System

A production-ready attendance tracking system using face recognition technology. Built with Python (ML service), Node.js (Backend API), Next.js (Frontend), and MySQL (Database).

## 🏗️ Architecture

```
Next.js Frontend (Camera UI)
        ↓
Node.js Backend API (Express)
        ↓
Python Face Service (Flask + face_recognition)
        ↓
MySQL Database (Face embeddings)
```

## 📋 Prerequisites

- **Python 3.8+** with `pip`
- **Node.js 18+** with `npm`
- **MySQL 8.0+**
- **Webcam** for face capture

## 🚀 Quick Start

### Step 1: Database Setup

1. **Install MySQL** (if not already installed):
   ```bash
   # macOS
   brew install mysql
   brew services start mysql
   
   # Linux
   sudo apt-get install mysql-server
   sudo systemctl start mysql
   ```

2. **Create Database**:
   ```bash
   mysql -u root -p < database/setup.sql
   ```
   
   Or manually:
   ```sql
   mysql -u root -p
   ```
   Then run:
   ```sql
   source database/setup.sql;
   ```

3. **Update Database Credentials**:
   - Copy `backend/.env.example` to `backend/.env`
   - Update database credentials in `backend/.env`

### Step 2: Python Face Recognition Service

1. **Navigate to face-service**:
   ```bash
   cd face-service
   ```

2. **Activate Virtual Environment**:
   ```bash
   source venv/bin/activate  # macOS/Linux
   # or
   venv\Scripts\activate  # Windows
   ```

3. **Install Dependencies** (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```

4. **Start Python Service**:
   ```bash
   python app.py
   ```
   
   Service will run on `http://localhost:5000`

### Step 3: Node.js Backend

1. **Navigate to backend**:
   ```bash
   cd backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start Backend Server**:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```
   
   Backend will run on `http://localhost:3001`

### Step 4: Next.js Frontend

1. **Navigate to frontend**:
   ```bash
   cd frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment** (optional):
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local if backend is not on localhost:3001
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   
   Frontend will run on `http://localhost:3000`

## 📖 Usage

### 1. Register Employee (Onboarding)

1. Open the frontend in your browser: `http://localhost:3000`
2. Click **"Register"** tab
3. Enter Employee Code (e.g., `EMP001`)
4. Enter Employee Name (e.g., `John Doe`)
5. Click **"Start Camera"** and allow camera permissions
6. Position face in front of camera
7. Click **"Register Employee"**
8. System will capture face and store embedding in database

### 2. Mark Attendance (Check-In/Out)

1. Click **"Check In/Out"** tab
2. Enter Employee Code
3. Click **"Start Camera"**
4. Position face in front of camera
5. Click **"Mark Attendance"**
6. System will:
   - Capture live face
   - Compare with stored embedding
   - Mark attendance as IN or OUT (automatically toggles)
   - Display confidence score

## 🔧 Configuration

### Database Configuration (`backend/.env`)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance_db
PORT=3001
FACE_SERVICE_URL=http://localhost:5000
```

### Face Recognition Threshold

The default threshold for face matching is **0.6** (distance). You can adjust this in:
- `face-service/app.py` - Line with `distance < 0.6`

Lower threshold = stricter matching (fewer false positives)
Higher threshold = more lenient matching (more false positives)

## 📁 Project Structure

```
Test_Attendance/
├── face-service/          # Python Flask service
│   ├── app.py            # Flask API endpoints
│   ├── utils.py          # Face recognition utilities
│   └── requirements.txt  # Python dependencies
│
├── backend/              # Node.js Express API
│   ├── server.js        # Express server & routes
│   ├── db.js            # MySQL connection pool
│   └── package.json     # Node dependencies
│
├── frontend/            # Next.js React app
│   ├── app/            # Next.js app directory
│   │   ├── page.tsx    # Main attendance page
│   │   └── layout.tsx  # App layout
│   └── package.json    # Frontend dependencies
│
└── database/            # SQL scripts
    ├── setup.sql       # Database schema
    └── sample_data.sql # Sample data (optional)
```

## 🔌 API Endpoints

### Python Face Service (`http://localhost:5000`)

- `GET /health` - Health check
- `POST /register-face` - Extract face embedding from image
- `POST /verify-face` - Verify face against stored embedding
- `POST /compare-faces` - Compare against multiple embeddings

### Node.js Backend (`http://localhost:3001`)

- `GET /health` - Health check
- `POST /api/employee/register` - Register new employee
- `GET /api/employees` - Get all employees
- `GET /api/employee/:empCode` - Get employee by code
- `POST /api/attendance/checkin` - Mark attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/stats` - Get statistics
- `DELETE /api/employee/:empCode` - Delete employee

## 🛡️ Security Best Practices

- ✅ Store **only face embeddings**, not raw images
- ✅ Use HTTPS in production
- ✅ Validate all inputs
- ✅ Use environment variables for sensitive data
- ✅ Implement rate limiting
- ✅ Add authentication/authorization
- ✅ Encrypt database connections
- ✅ Regular database backups

## 🐛 Troubleshooting

### Camera Not Working
- Check browser permissions for camera access
- Ensure HTTPS in production (required for camera)
- Try different browsers (Chrome/Firefox recommended)

### Face Not Detected
- Ensure good lighting
- Face should be clearly visible
- Only one face in frame
- Remove glasses/masks if needed

### Database Connection Error
- Verify MySQL is running: `brew services list` (macOS)
- Check credentials in `backend/.env`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Python Service Error
- Ensure virtual environment is activated
- Install dependencies: `pip install -r requirements.txt`
- Check if port 5000 is available

## 🚀 Production Deployment

1. **Environment Variables**: Set all environment variables
2. **HTTPS**: Use HTTPS for frontend (required for camera)
3. **Database**: Use production MySQL instance
4. **Process Manager**: Use PM2 for Node.js, systemd for Python
5. **Reverse Proxy**: Use Nginx/Apache
6. **Monitoring**: Add logging and monitoring
7. **Backups**: Regular database backups

## 📝 License

MIT License - feel free to use for your projects!

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using open-source face recognition technology**
