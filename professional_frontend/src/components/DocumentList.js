import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  BarChart3,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../services/apiService';

const DocumentList = ({ onDocumentSelect }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDocumentList();
      setDocuments(response.documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.document_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterType === 'all') return matchesSearch;
      
      // Add more filter logic here based on document types
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'filename':
          return a.filename.localeCompare(b.filename);
        case 'type':
          return a.document_type.localeCompare(b.document_type);
        case 'confidence':
          return b.confidence_score - a.confidence_score;
        case 'timestamp':
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Document Archive</h1>
          <p className="text-text-secondary mt-2">
            Browse and manage your processed documents
          </p>
        </div>
        <button
          onClick={loadDocuments}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {documents.length}
              </div>
              <div className="text-sm text-text-secondary">Total Documents</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {documents.length > 0 ? Math.round(documents.reduce((sum, doc) => sum + doc.confidence_score, 0) / documents.length) : 0}%
              </div>
              <div className="text-sm text-text-secondary">Avg Confidence</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {documents.filter(doc => {
                  const today = new Date();
                  const docDate = new Date(doc.timestamp);
                  return docDate.toDateString() === today.toDateString();
                }).length}
              </div>
              <div className="text-sm text-text-secondary">Today</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {new Set(documents.map(doc => doc.document_type)).size}
              </div>
              <div className="text-sm text-text-secondary">Document Types</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-64"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field w-40"
            >
              <option value="timestamp">Sort by Date</option>
              <option value="filename">Sort by Name</option>
              <option value="type">Sort by Type</option>
              <option value="confidence">Sort by Confidence</option>
            </select>
          </div>
          
          <div className="text-sm text-text-secondary">
            Showing {filteredAndSortedDocuments.length} of {documents.length} documents
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedDocuments.length > 0 ? (
          <div className="space-y-3">
            {filteredAndSortedDocuments.map((doc) => (
              <div key={doc.document_id} className="card hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-text-muted" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-text-primary truncate">
                          {doc.filename}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getDocumentTypeColor(doc.document_type)}`}>
                          {doc.document_type}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-text-secondary">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(doc.timestamp)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-4 h-4" />
                          <span className={apiService.getConfidenceColor(doc.confidence_score)}>
                            {doc.confidence_score}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onDocumentSelect(doc.document_id)}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No Documents Found
            </h3>
            <p className="text-text-secondary">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by uploading your first document'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;
