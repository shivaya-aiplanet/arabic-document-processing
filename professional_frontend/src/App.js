import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DocumentUpload from './components/DocumentUpload';
import ProcessingStatus from './components/ProcessingStatus';
import DocumentResults from './components/DocumentResults';
import DocumentList from './components/DocumentList';
import { apiService } from './services/apiService';
import './index.css';

function App() {
  const [currentDocument, setCurrentDocument] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [documentResult, setDocumentResult] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [apiHealth, setApiHealth] = useState(null);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const health = await apiService.checkHealth();
      setApiHealth(health);
    } catch (error) {
      console.error('Health check failed:', error);
      setApiHealth({ status: 'unhealthy', error: error.message });
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setDocumentResult(null);
      setProcessingStatus({
        status: 'processing',
        message: 'Processing document...',
        progress: 0
      });

      // Set current document info
      setCurrentDocument({
        filename: file.name,
        file_size: file.size
      });

      // Upload and process document (our backend returns result directly)
      const result = await apiService.uploadDocument(file);

      // Set the result directly
      setDocumentResult(result);
      setProcessingStatus({
        status: 'completed',
        message: 'Processing completed successfully',
        progress: 100
      });

    } catch (error) {
      console.error('Upload failed:', error);
      setProcessingStatus({
        status: 'failed',
        message: error.message || 'Upload failed'
      });
    }
  };

  // Removed polling function since our backend returns results directly

  const handleReset = () => {
    setCurrentDocument(null);
    setProcessingStatus(null);
    setDocumentResult(null);
  };

  const handleDocumentSelect = async (documentId) => {
    try {
      // For now, we don't have a document storage system
      // This would be implemented when adding document persistence
      console.log('Document selection not implemented yet:', documentId);
    } catch (error) {
      console.error('Failed to load document:', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-bg-light">
        <Header 
          apiHealth={apiHealth} 
          onRefreshHealth={checkApiHealth}
          onReset={handleReset}
        />
        
        <div className="flex">
          <Sidebar 
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            documentResult={documentResult}
            onDocumentSelect={handleDocumentSelect}
          />
          
          <main className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-80'
          }`}>
            <div className="max-w-7xl mx-auto px-6 py-8">
              <Routes>
                <Route path="/" element={
                  <div className="space-y-8">
                    {/* Hero Section */}
                    <div className="bg-deep-teal rounded-xl p-8 text-white">
                      <h1 className="text-4xl font-bold mb-4">
                        Arabic Document Indexing System
                      </h1>
                      <p className="text-xl opacity-90">
                        Automated document processing and indexing for Arabic government documents
                      </p>
                    </div>

                    {/* Main Content */}
                    {!currentDocument && !documentResult && (
                      <DocumentUpload onFileUpload={handleFileUpload} />
                    )}

                    {processingStatus && processingStatus.status !== 'completed' && (
                      <ProcessingStatus 
                        status={processingStatus}
                        filename={currentDocument?.filename}
                        onCancel={handleReset}
                      />
                    )}

                    {documentResult && (
                      <DocumentResults 
                        result={documentResult}
                        onReset={handleReset}
                      />
                    )}
                  </div>
                } />
                
                <Route path="/documents" element={
                  <DocumentList onDocumentSelect={handleDocumentSelect} />
                } />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
