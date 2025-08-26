import axios from 'axios';

const API_BASE_URL = 'https://arabic-backend.aiplanet.com';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for long processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.detail || 'Bad request');
    } else if (error.response?.status === 500) {
      throw new Error(error.response.data?.detail || 'Server error');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - processing may still be in progress');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error - please check your connection');
    }
    
    throw new Error(error.response?.data?.detail || error.message || 'Unknown error');
  }
);

export const apiService = {
  // Health check
  async checkHealth() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  },

  // Upload document
  async uploadDocument(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Don't timeout on upload
        timeout: 0,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  },

  // Get processing status
  async getProcessingStatus(documentId) {
    try {
      const response = await api.get(`/status/${documentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get status: ${error.message}`);
    }
  },

  // Get processing result
  async getProcessingResult(documentId) {
    try {
      const response = await api.get(`/result/${documentId}`);
      return response.data;
    } catch (error) {
      if (error.message.includes('202')) {
        throw new Error('Document is still processing');
      }
      throw new Error(`Failed to get result: ${error.message}`);
    }
  },

  // List all processed documents
  async getDocumentList() {
    try {
      const response = await api.get('/documents');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get document list: ${error.message}`);
    }
  },

  // Utility function to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Utility function to format processing time
  formatProcessingTime(seconds) {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  },

  // Utility function to get confidence color
  getConfidenceColor(confidence) {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  },

  // Utility function to get status color
  getStatusColor(status) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  // Utility function to get field type icon
  getFieldTypeIcon(fieldType) {
    switch (fieldType) {
      case 'date':
        return '📅';
      case 'number':
        return '🔢';
      case 'classification':
        return '🏷️';
      case 'text':
      default:
        return '📝';
    }
  },

  // Utility function to validate file
  validateFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

    if (!file) {
      throw new Error('No file selected');
    }

    if (file.size > maxSize) {
      throw new Error('File size must be less than 50MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File must be PDF, PNG, or JPEG');
    }

    return true;
  },

  // Re-analyze edited OCR text with LLM
  reanalyzeText: async (data) => {
    try {
      const response = await api.post('/reanalyze', data);
      return response.data;
    } catch (error) {
      console.error('Re-analysis error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to re-analyze text');
    }
  },

  // Analyze document for insights and validation
  analyzeDocument: async (data) => {
    try {
      const response = await api.post('/analyze-document', data);
      return response.data;
    } catch (error) {
      console.error('Document analysis error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to analyze document');
    }
  }
};
