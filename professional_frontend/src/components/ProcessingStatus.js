import React from 'react';
import { 
  FileText, 
  Eye, 
  Brain, 
  CheckCircle, 
  XCircle, 
  Loader,
  X
} from 'lucide-react';

const ProcessingStatus = ({ status, filename, onCancel }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'processing':
        return <Loader className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Loader className="w-8 h-8 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };



  return (
    <div className="max-w-4xl mx-auto">
      <div className={`card ${getStatusColor()}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {getStatusIcon()}
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {status.status === 'processing' ? 'Processing Document' : 
                 status.status === 'completed' ? 'Processing Complete' : 
                 'Processing Failed'}
              </h2>
              <p className="text-text-secondary">
                {filename}
              </p>
            </div>
          </div>
          
          {status.status === 'processing' && onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Cancel Processing"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          )}
        </div>

        {/* Simple Processing Indicator */}
        {status.status === 'processing' && (
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-text-secondary">
                Processing document with AI agents...
              </span>
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            </div>
          </div>
        )}

        {/* Error Details */}
        {status.status === 'failed' && (
          <div className="mt-6 p-4 bg-red-100 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">
              Processing Failed
            </h4>
            <p className="text-red-700 text-sm">
              {status.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingStatus;
