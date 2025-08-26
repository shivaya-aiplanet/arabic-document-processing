import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Clock, 
  Eye,
  FolderOpen,
  Search
} from 'lucide-react';
import { apiService } from '../services/apiService';

const Sidebar = ({ collapsed, onToggle, documentResult, onDocumentSelect }) => {
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRecentDocuments();
  }, []);

  const loadRecentDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDocumentList();
      setRecentDocuments(response.documents.slice(0, 10)); // Show last 10
    } catch (error) {
      console.error('Failed to load recent documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = recentDocuments.filter(doc =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      'شهادة': 'bg-blue-100 text-blue-800',
      'هوية': 'bg-green-100 text-green-800',
      'جواز': 'bg-purple-100 text-purple-800',
      'عقد': 'bg-orange-100 text-orange-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    
    for (const [key, color] of Object.entries(colors)) {
      if (type.includes(key)) return color;
    }
    return colors.default;
  };

  return (
    <div className={`
      fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 
      transition-all duration-300 z-40
      ${collapsed ? 'w-16' : 'w-80'}
    `}>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-text-muted" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-text-muted" />
        )}
      </button>

      {/* Sidebar Content */}
      <div className="h-full overflow-hidden">
        {collapsed ? (
          /* Collapsed View */
          <div className="p-4 space-y-4">
            <div className="w-8 h-8 bg-emerald rounded-lg flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            {recentDocuments.slice(0, 5).map((doc) => (
              <button
                key={doc.document_id}
                onClick={() => onDocumentSelect(doc.document_id)}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                title={doc.filename}
              >
                <FileText className="w-4 h-4 text-text-muted" />
              </button>
            ))}
          </div>
        ) : (
          /* Expanded View */
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <FolderOpen className="w-5 h-5 text-emerald" />
                <h3 className="font-semibold text-text-primary">Documents</h3>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald focus:border-emerald outline-none"
                />
              </div>
            </div>

            {/* Current Document */}
            {documentResult && (
              <div className="p-4 border-b border-gray-200 bg-emerald/5">
                <div className="text-xs font-medium text-emerald mb-2">CURRENT DOCUMENT</div>
                <div className="space-y-2">
                  <div className="font-medium text-text-primary text-sm truncate">
                    {documentResult.filename}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-text-secondary">
                    <Eye className="w-3 h-3" />
                    <span>{documentResult.total_pages} pages</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-text-secondary">
                    <Clock className="w-3 h-3" />
                    <span>{apiService.formatProcessingTime(documentResult.processing_time)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Documents List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4">
                <div className="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wide">
                  Recent Documents ({filteredDocuments.length})
                </div>
                
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {filteredDocuments.map((doc) => (
                      <button
                        key={doc.document_id}
                        onClick={() => onDocumentSelect(doc.document_id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-start space-x-3">
                          <FileText className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-text-primary truncate group-hover:text-emerald">
                              {doc.filename}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getDocumentTypeColor(doc.document_type)}`}>
                                {doc.document_type}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-text-secondary">
                                {formatDate(doc.timestamp)}
                              </span>
                              <span className={`text-xs ${apiService.getConfidenceColor(doc.confidence_score)}`}>
                                {doc.confidence_score}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">
                      {searchTerm ? 'No documents found' : 'No documents yet'}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-xs text-emerald hover:underline mt-1"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={loadRecentDocuments}
                className="w-full text-sm text-emerald hover:text-emerald-700 font-medium"
              >
                Refresh List
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
