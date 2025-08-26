import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Activity, 
  RefreshCw, 
  Home, 
  FolderOpen,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const Header = ({ apiHealth, onRefreshHealth, onReset }) => {
  const location = useLocation();

  const getHealthIcon = () => {
    if (!apiHealth) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    
    switch (apiHealth.status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getHealthText = () => {
    if (!apiHealth) return 'Checking...';
    
    switch (apiHealth.status) {
      case 'healthy':
        return 'All Systems Operational';
      case 'unhealthy':
        return 'System Issues Detected';
      default:
        return 'Status Unknown';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16 relative">
          {/* AIplanet Logo - Left Corner */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <img
              src="/aiplanetlogo.png"
              alt="AIplanet Logo"
              className="w-32 h-32 object-contain"
            />
          </div>

          {/* Title - Original Position */}
          <div className="flex items-center space-x-4 ml-36">
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                Document Indexing
              </h1>
              <p className="text-xs text-text-secondary">
                Arabic AI Processing System
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/'
                  ? 'bg-emerald text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
              }`}
              onClick={onReset}
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Home</span>
            </Link>
            
            <Link
              to="/documents"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/documents'
                  ? 'bg-emerald text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="font-medium">Documents</span>
            </Link>
          </nav>

          {/* System Status - Simplified */}
          <div className="flex items-center space-x-4">
            {/* Service Status Details */}
            {apiHealth && apiHealth.services && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    apiHealth.services.qari_ocr === 'connected'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-text-muted">OCR</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    apiHealth.services.groq_llm === 'configured'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-text-muted">LLM</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health Details Banner (if unhealthy) */}
      {apiHealth && apiHealth.status === 'unhealthy' && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">
                System Issue: {apiHealth.error || 'Unknown error'}
              </span>
              <button
                onClick={onRefreshHealth}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
