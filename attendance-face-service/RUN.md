# How to Run Python Face Service

## Quick Start

### Step 1: Activate Virtual Environment

```bash
cd attendance-face-service
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### Step 2: Install Dependencies (if not already installed)

```bash
pip install -r requirements.txt
```

### Step 3: Run the Service

```bash
python app.py
```

The service will start on `http://localhost:5000`

---

## Detailed Steps

### 1. Navigate to the service directory:
```bash
cd attendance-face-service
```

### 2. Activate virtual environment:
```bash
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 3. Check if dependencies are installed:
```bash
pip list | grep flask
```

If Flask is not listed, install dependencies:
```bash
pip install -r requirements.txt
```

### 4. Run the service:
```bash
python app.py
```

You should see:
```
Starting Face Recognition Service on http://localhost:5000
 * Running on http://0.0.0.0:5000
```

### 5. Test the service:
Open another terminal and test:
```bash
curl http://localhost:5000/health
```

Should return: `{"status":"ok","service":"face-recognition"}`

---

## Environment Variables (Optional)

Create `.env` file (copy from `env.example`):
```bash
cp env.example .env
```

Edit `.env` if needed (defaults are usually fine):
```env
PORT=5000
FLASK_ENV=development
```

---

## Troubleshooting

### "Module not found" errors:
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### "Port already in use":
- Change port in `app.py` or `.env` file
- Or kill the process using port 5000

### "face_recognition" installation fails:
- This is a heavy package, may take time
- On macOS, you might need: `brew install cmake`
- On Linux: `sudo apt-get install cmake`

---

## Stop the Service

Press `Ctrl + C` in the terminal where the service is running.

---

## Deactivate Virtual Environment

When done:
```bash
deactivate
```
