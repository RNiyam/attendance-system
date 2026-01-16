#!/bin/bash

# Start Face Recognition Service
cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Start Flask app
echo "Starting Face Recognition Service on http://localhost:5000"
python3 app.py
