# ✅ Python Face Service - Setup Complete

## Installation Steps (if starting fresh)

```bash
cd attendance-face-service

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install all dependencies
pip3 install -r requirements.txt
```

## Run the Service

```bash
cd attendance-face-service
source venv/bin/activate
python3 app.py
```

The service will start on `http://localhost:5000`

## Test

```bash
curl http://localhost:5000/health
```

Should return: `{"status":"ok","service":"face-recognition"}`

## Important Notes

- Use `python3` and `pip3` on macOS (not `python` or `pip`)
- The `face_recognition_models` package is now included in `requirements.txt`
- All dependencies should install automatically with `pip3 install -r requirements.txt`
