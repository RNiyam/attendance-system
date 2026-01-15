@echo off
REM Face Recognition Attendance System - Startup Script for Windows
REM This script starts all services

echo Starting Face Recognition Attendance System...
echo.

REM Start Python Face Service
echo Starting Python Face Recognition Service...
cd face-service
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
start "Python Face Service" cmd /k "python app.py"
cd ..
timeout /t 2 /nobreak >nul

REM Start Node.js Backend
echo Starting Node.js Backend...
cd backend
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --silent
)
if not exist ".env" (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo Please update backend\.env with your database credentials!
)
start "Node.js Backend" cmd /k "npm start"
cd ..
timeout /t 2 /nobreak >nul

REM Start Next.js Frontend
echo Starting Next.js Frontend...
cd frontend
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --silent
)
start "Next.js Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ============================================================
echo   All services started successfully!
echo ============================================================
echo.
echo Services running:
echo   Python Face Service:  http://localhost:5000
echo   Node.js Backend:      http://localhost:3001
echo   Next.js Frontend:     http://localhost:3000
echo.
pause
