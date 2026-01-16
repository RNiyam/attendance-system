import base64
import numpy as np
from PIL import Image
import io
import face_recognition

def base64_to_image(base64_str):
    """Convert base64 string to numpy image array"""
    # Handle data URL format (data:image/jpeg;base64,...)
    if ',' in base64_str:
        img_bytes = base64.b64decode(base64_str.split(',')[1])
    else:
        img_bytes = base64.b64decode(base64_str)
    return np.array(Image.open(io.BytesIO(img_bytes)))

def get_face_embedding(image):
    """Extract face embedding from image. Returns None if no face or multiple faces detected."""
    encodings = face_recognition.face_encodings(image)
    if len(encodings) != 1:
        return None
    return encodings[0]

def get_face_locations(image):
    """Get face locations in the image"""
    return face_recognition.face_locations(image)
