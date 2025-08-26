import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Image, 
  AlertCircle, 
  CheckCircle,
  X
} from 'lucide-react';
import { apiService } from '../services/apiService';

const DocumentUpload = ({ onFileUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setUploadError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setUploadError('File size must be less than 50MB');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setUploadError('Only PDF, PNG, and JPEG files are supported');
      } else {
        setUploadError('Invalid file selected');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      try {
        apiService.validateFile(file);
        setSelectedFile(file);
        setUploadError(null);
      } catch (error) {
        setUploadError(error.message);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await onFileUpload(selectedFile);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadError(null);
  };

  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <Image className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload Instructions */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-4">
          Upload Arabic Document
        </h2>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Upload a PDF or image file containing Arabic text for automatic indexing and analysis. 
          Our AI will extract key information and provide structured data for your archiving system.
        </p>
      </div>

      {/* Upload Area */}
      <div className="max-w-2xl mx-auto">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
            ${isDragActive 
              ? 'border-emerald bg-emerald/5 scale-105' 
              : selectedFile 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 hover:border-emerald hover:bg-emerald/5'
            }
          `}
        >
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  File Selected
                </h3>
                <div className="flex items-center justify-center space-x-3 mt-3">
                  {getFileIcon(selectedFile)}
                  <div className="text-left">
                    <p className="font-medium text-text-primary">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {apiService.formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className={`w-16 h-16 mx-auto ${
                isDragActive ? 'text-emerald' : 'text-gray-400'
              }`} />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {isDragActive ? 'Drop your file here' : 'Choose a file or drag it here'}
                </h3>
                <p className="text-text-secondary mt-2">
                  Supports PDF, PNG, and JPEG files up to 50MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {uploadError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">
                {uploadError}
              </span>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && !uploadError && (
          <div className="mt-6 text-center">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`
                btn-primary px-8 py-4 text-lg
                ${isUploading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105'
                }
              `}
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Start Processing</span>
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto mt-12">
        <h3 className="text-xl font-semibold text-text-primary text-center mb-8">
          What Our System Extracts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-text-primary mb-2">Document Type</h4>
            <p className="text-sm text-text-secondary">
              Automatically identifies document classification
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">🔢</span>
            </div>
            <h4 className="font-semibold text-text-primary mb-2">Key Numbers</h4>
            <p className="text-sm text-text-secondary">
              Document numbers, IDs, and reference codes
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">📅</span>
            </div>
            <h4 className="font-semibold text-text-primary mb-2">Dates</h4>
            <p className="text-sm text-text-secondary">
              Hijri and Gregorian dates extraction
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">👤</span>
            </div>
            <h4 className="font-semibold text-text-primary mb-2">Entities</h4>
            <p className="text-sm text-text-secondary">
              Names, organizations, and locations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
