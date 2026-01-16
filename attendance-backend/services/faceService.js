const axios = require('axios');
require('dotenv').config();

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:8000';

class FaceService {
  /**
   * Register a face and get its embedding
   * @param {string} image - Base64 encoded image
   * @returns {Promise<Object>} Face embedding array
   */
  async registerFace(image) {
    try {
      console.log(`\n📸 REGISTERING FACE WITH PYTHON SERVICE:`);
      console.log(`   Service URL: ${FACE_SERVICE_URL}/register-face`);
      console.log(`   Image size: ${image ? (image.length / 1024).toFixed(2) + ' KB' : 'null'}`);
      
      // First, check if service is available
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        throw new Error(`Face recognition service is not available at ${FACE_SERVICE_URL}. Please ensure the Python service is running on port 8000.`);
      }
      
      // Extract base64 data if it's a data URL (format: data:image/jpeg;base64,/9j/4AAQ...)
      let imageData = image;
      if (image && typeof image === 'string' && image.includes(',')) {
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        imageData = image.split(',')[1];
        console.log(`   Extracted base64 data (first 50 chars): ${imageData.substring(0, 50)}...`);
      }
      
      const response = await axios.post(`${FACE_SERVICE_URL}/register-face`, {
        image: imageData || image
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      console.log('Python service response status:', response.status);
      console.log('Python service response data:', JSON.stringify(response.data).substring(0, 200));

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      if (!response.data.embedding) {
        throw new Error('No embedding returned from face recognition service');
      }

      return response.data.embedding;
    } catch (error) {
      console.error('Face service error details:', {
        code: error.code,
        message: error.message,
        status: error.response?.status,
        url: `${FACE_SERVICE_URL}/register-face`
      });
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Face recognition service is not available. Please ensure the Python service is running on port 8000.');
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Face recognition service endpoint not found. Check if service is running correctly. URL: ${FACE_SERVICE_URL}/register-face`);
      }
      
      if (error.message) {
        throw new Error(`Face recognition error: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Verify a face against a stored embedding
   * @param {Array} storedEmbedding - Stored face embedding (128-dimensional array)
   * @param {string} image - Base64 encoded image to verify
   * @returns {Promise<Object>} Verification result with match, confidence, distance
   */
  async verifyFace(storedEmbedding, image) {
    try {
      console.log(`\n🔍 VERIFYING FACE WITH PYTHON SERVICE:`);
      console.log(`   Embedding length: ${storedEmbedding.length}`);
      console.log(`   Image size: ${image ? (image.length / 1024).toFixed(2) + ' KB' : 'null'}`);

      const response = await axios.post(`${FACE_SERVICE_URL}/verify-face`, {
        stored_embedding: storedEmbedding,
        image: image
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        responseType: 'json',
        validateStatus: function (status) {
          return status < 500; // Don't throw for 4xx errors
        }
      });

      console.log('Python service response status:', response.status);
      console.log('Python service response data:', JSON.stringify(response.data).substring(0, 200));

      if (!response || !response.data) {
        throw new Error('Invalid response from face recognition service');
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return {
        match: response.data.match || false,
        confidence: response.data.confidence || 0,
        distance: response.data.distance || 1.0,
        threshold: response.data.threshold || 0.45
      };
    } catch (error) {
      console.error('Error calling face service:', error.message);
      console.error('Error code:', error.code);
      console.error('Error response:', error.response?.data);
      console.error('Error stack:', error.stack);

      if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
        throw new Error('Face recognition service is not available. Please ensure the Python service is running on port 8000.');
      }

      if (error.response?.data) {
        throw new Error(error.response.data.error || 'Face verification service error');
      }

      if (error.message && error.message.includes('JSON')) {
        throw new Error('Invalid response from face recognition service. Please check the Python service logs.');
      }

      throw error;
    }
  }

  /**
   * Health check for face service
   * @returns {Promise<boolean>} True if service is available
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${FACE_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new FaceService();
