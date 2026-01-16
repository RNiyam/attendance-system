# Face Recognition Service

Python Flask service for face detection and recognition.

## Environment Variables

Create a `.env` file with:

```
PORT=5000
FLASK_ENV=production
```

## Installation

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

Or with Flask:
```bash
flask run --host=0.0.0.0 --port=5000
```

## API Endpoints

- `GET /health` - Health check
- `POST /register-face` - Register face and get embedding
- `POST /verify-face` - Verify face against stored embedding

## Deployment

Deploy to Render, EC2, or similar platform. This service has NO database access.
