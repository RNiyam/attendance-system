#!/bin/bash

# Face Recognition Attendance System - Startup Script
# This script starts all services in separate terminal windows/tabs

echo "🚀 Starting Face Recognition Attendance System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MySQL is running
echo -e "${BLUE}Checking MySQL...${NC}"
if ! mysqladmin ping -h localhost -u root --silent 2>/dev/null; then
    echo -e "${YELLOW}⚠️  MySQL doesn't seem to be running. Please start MySQL first.${NC}"
    echo "   macOS: brew services start mysql"
    echo "   Linux: sudo systemctl start mysql"
    echo ""
fi

# Start Python Face Service
echo -e "${GREEN}Starting Python Face Recognition Service...${NC}"
cd face-service
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
python app.py &
PYTHON_PID=$!
cd ..
echo -e "${GREEN}✓ Python service started (PID: $PYTHON_PID)${NC}"
sleep 2

# Start Node.js Backend
echo -e "${GREEN}Starting Node.js Backend...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --silent
fi
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env from .env.example..."
    cp .env.example .env 2>/dev/null || cp env.example .env 2>/dev/null || echo "⚠️  Please create backend/.env manually!"
    echo "⚠️  Please update backend/.env with your database credentials!"
fi
npm start &
NODE_PID=$!
cd ..
echo -e "${GREEN}✓ Node.js backend started (PID: $NODE_PID)${NC}"
sleep 2

# Start Next.js Frontend
echo -e "${GREEN}Starting Next.js Frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --silent
fi
npm run dev &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✓ Next.js frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ All services started successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Services running:"
echo "  🐍 Python Face Service:  http://localhost:5000"
echo "  🟢 Node.js Backend:      http://localhost:3001"
echo "  ⚛️  Next.js Frontend:     http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
trap "echo ''; echo 'Stopping all services...'; kill $PYTHON_PID $NODE_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
