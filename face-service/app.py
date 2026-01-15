from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import base64_to_image, get_face_embedding
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "face-recognition"})

@app.route('/register-face', methods=['POST'])
def register_face():
    """Register a face and return its embedding"""
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({"error": "Image is required"}), 400
        
        image = base64_to_image(data['image'])
        embedding = get_face_embedding(image)

        if embedding is None:
            return jsonify({"error": "Face not detected or multiple faces detected. Please ensure exactly one face is visible."}), 400

        # Convert numpy array to Python list of floats for JSON serialization
        embedding_list = [float(x) for x in embedding.tolist()]
        
        response_data = {
            "embedding": embedding_list,
            "message": "Face registered successfully"
        }
        
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/verify-face', methods=['POST'])
def verify_face():
    """Verify a face against a stored embedding"""
    try:
        # Check if request has JSON
        if not request.is_json:
            return jsonify({"error": "Request must be JSON", "match": False, "confidence": 0.0}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON data", "match": False, "confidence": 0.0}), 400
            
        if 'image' not in data or 'stored_embedding' not in data:
            return jsonify({"error": "Image and stored_embedding are required", "match": False, "confidence": 0.0}), 400
        
        # Validate stored_embedding is a list
        if not isinstance(data['stored_embedding'], list):
            return jsonify({"error": "stored_embedding must be a list", "match": False, "confidence": 0.0}), 400
        
        stored_embedding = np.array(data['stored_embedding'])
        image = base64_to_image(data['image'])

        live_embedding = get_face_embedding(image)
        if live_embedding is None:
            response_data = {
                "match": False,
                "confidence": 0.0,
                "distance": 1.0,
                "error": "Face not detected or multiple faces detected"
            }
            return jsonify(response_data)

        # Calculate Euclidean distance between embeddings
        distance = np.linalg.norm(stored_embedding - live_embedding)
        distance_float = float(distance)
        
        # STRICT THRESHOLDS for face matching:
        # - Distance < 0.5 = same person (stricter than default 0.6)
        # - Distance >= 0.5 = different person
        # Lower distance = more similar faces
        # Typical face recognition thresholds:
        #   - < 0.4 = very confident match
        #   - 0.4-0.5 = likely match
        #   - 0.5-0.6 = uncertain, might be different person
        #   - >= 0.6 = definitely different person
        
        # VERY STRICT THRESHOLDS to prevent false matches
        # Distance must be < 0.45 (stricter than 0.5)
        # This means confidence must be > 55%
        STRICT_DISTANCE_THRESHOLD = 0.45  # Very strict threshold
        MIN_CONFIDENCE_THRESHOLD = 0.55   # Require at least 55% confidence
        
        # Confidence calculation: inverse of distance (normalized to 0-1)
        # Higher confidence = more certain it's the same person
        confidence = float(max(0.0, min(1.0, float(1 - distance_float))))
        
        # Match only if BOTH conditions are met:
        # 1. Distance is below strict threshold (< 0.45)
        # 2. Confidence is above minimum threshold (> 55%)
        match = bool(distance_float < STRICT_DISTANCE_THRESHOLD and confidence >= MIN_CONFIDENCE_THRESHOLD)
        
        # Log for debugging
        print(f"Face verification: distance={distance_float:.4f}, match={match}, confidence={confidence:.4f}, threshold={STRICT_DISTANCE_THRESHOLD}")

        # Ensure all values are JSON serializable
        response_data = {
            "match": bool(match),
            "confidence": float(confidence),
            "distance": float(distance_float),
            "threshold": float(STRICT_DISTANCE_THRESHOLD)
        }
        
        return jsonify(response_data)
    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"Error in verify_face: {error_msg}")
        print(traceback.format_exc())
        try:
            # Ensure we return valid JSON with all values properly serialized
            response_data = {
                "error": str(error_msg),
                "match": False,
                "confidence": 0.0,
                "distance": 1.0
            }
            return jsonify(response_data), 500
        except Exception as json_error:
            # Fallback if jsonify fails
            print(f"Error creating JSON response: {json_error}")
            import json
            return json.dumps({
                "error": "Internal server error",
                "match": False,
                "confidence": 0.0,
                "distance": 1.0
            }), 500, {'Content-Type': 'application/json'}

@app.route('/compare-faces', methods=['POST'])
def compare_faces():
    """Compare multiple stored embeddings with a live face"""
    try:
        data = request.json
        if not data or 'image' not in data or 'stored_embeddings' not in data:
            return jsonify({"error": "Image and stored_embeddings array are required"}), 400
        
        image = base64_to_image(data['image'])
        live_embedding = get_face_embedding(image)
        
        if live_embedding is None:
            response_data = {
                "match": False,
                "best_match_index": None,
                "confidence": 0.0,
                "error": "Face not detected or multiple faces detected"
            }
            return jsonify(response_data)

        stored_embeddings = [np.array(emb) for emb in data['stored_embeddings']]
        distances = [np.linalg.norm(live_embedding - stored) for stored in stored_embeddings]
        
        min_distance = float(min(distances))
        best_match_index = int(distances.index(min_distance))
        match = bool(min_distance < 0.6)
        confidence = float(max(0.0, min(1.0, float(1 - min_distance))))

        response_data = {
            "match": bool(match),
            "best_match_index": int(best_match_index),
            "confidence": float(confidence),
            "distance": float(min_distance)
        }
        
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Face Recognition Service on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
