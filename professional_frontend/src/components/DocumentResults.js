import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  FileText,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Edit3,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { apiService } from '../services/apiService';

const DocumentResults = ({ result, onReset }) => {
  const [activeTab, setActiveTab] = useState('entities');
  const [showRawText, setShowRawText] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedPage, setSelectedPage] = useState(0);
  const [editingText, setEditingText] = useState(false);
  const [editedOcrText, setEditedOcrText] = useState('');
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzedData, setReanalyzedData] = useState(null);

  // State for editing extracted data fields
  const [editingField, setEditingField] = useState(null);
  const [editedFieldValue, setEditedFieldValue] = useState('');
  const [editedFields, setEditedFields] = useState({});

  // State for PDF table data
  const [pdfTableData, setPdfTableData] = useState([]);
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [newRowKey, setNewRowKey] = useState('');
  const [newRowValue, setNewRowValue] = useState('');

  // Function to translate English keys to Arabic
  const translateToArabic = (englishKey) => {
    const translations = {
      'name': 'الاسم',
      'date': 'التاريخ',
      'document_number': 'رقم الوثيقة',
      'title': 'العنوان',
      'author': 'المؤلف',
      'signatory': 'الموقع',
      'department': 'القسم',
      'ministry': 'الوزارة',
      'reference': 'المرجع',
      'subject': 'الموضوع',
      'recipient': 'المستلم',
      'sender': 'المرسل',
      'classification': 'التصنيف',
      'priority': 'الأولوية',
      'status': 'الحالة',
      'location': 'الموقع',
      'organization': 'المنظمة',
      'position': 'المنصب',
      'phone': 'الهاتف',
      'email': 'البريد الإلكتروني',
      'address': 'العنوان',
      'id_number': 'رقم الهوية',
      'passport_number': 'رقم جواز السفر',
      'nationality': 'الجنسية',
      'birth_date': 'تاريخ الميلاد',
      'issue_date': 'تاريخ الإصدار',
      'expiry_date': 'تاريخ الانتهاء',
      'amount': 'المبلغ',
      'currency': 'العملة',
      'description': 'الوصف',
      'notes': 'الملاحظات',
      'approval': 'الموافقة',
      'signature': 'التوقيع'
    };

    return translations[englishKey.toLowerCase()] || englishKey;
  };






  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleEditText = () => {
    const currentPage = result.pages[selectedPage];
    const ocrText = currentPage?.ocr_result?.text || '';
    setEditedOcrText(ocrText);
    setEditingText(true);
  };

  const handleCancelEdit = () => {
    setEditingText(false);
    setEditedOcrText('');
  };

  const handleReanalyze = async () => {
    if (!editedOcrText.trim()) {
      alert('Please enter some text to analyze');
      return;
    }

    setIsReanalyzing(true);
    try {
      const currentPage = result.pages[selectedPage];
      const response = await apiService.reanalyzeText({
        ocr_text: editedOcrText,
        filename: result.filename,
        page_number: selectedPage + 1,
        doc_id: result.document_id || 'edited'
      });

      if (response.success) {
        setReanalyzedData(response.extracted_data);
        setEditingText(false);
        alert('Text re-analyzed successfully! Updated results are now displayed.');
      } else {
        alert('Re-analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Re-analysis error:', error);
      alert('Failed to re-analyze text. Please check your connection and try again.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Handlers for editing extracted data fields
  const handleEditField = (fieldKey, currentValue) => {
    setEditingField(fieldKey);
    setEditedFieldValue(currentValue);
  };

  const handleSaveField = (fieldKey) => {
    setEditedFields(prev => ({
      ...prev,
      [fieldKey]: editedFieldValue
    }));
    setEditingField(null);
    setEditedFieldValue('');
  };

  const handleCancelFieldEdit = () => {
    setEditingField(null);
    setEditedFieldValue('');
  };

  // PDF Table Management Functions
  const handleAddRow = () => {
    if (newRowKey.trim() && newRowValue.trim()) {
      const newRow = {
        id: Date.now() + Math.random(),
        key: newRowKey.trim(),
        value: newRowValue.trim()
      };
      setPdfTableData(prev => [...prev, newRow]);
      setNewRowKey('');
      setNewRowValue('');
    }
  };

  const handleEditRow = (rowId, key, value) => {
    setEditingRow(rowId);
    setNewRowKey(key);
    setNewRowValue(value);
  };

  const handleSaveRow = () => {
    if (newRowKey.trim() && newRowValue.trim()) {
      setPdfTableData(prev => prev.map(row =>
        row.id === editingRow
          ? { ...row, key: newRowKey.trim(), value: newRowValue.trim() }
          : row
      ));
      setEditingRow(null);
      setNewRowKey('');
      setNewRowValue('');
    }
  };

  const handleDeleteRow = (rowId) => {
    setPdfTableData(prev => prev.filter(row => row.id !== rowId));
  };

  const handleCancelRowEdit = () => {
    setEditingRow(null);
    setNewRowKey('');
    setNewRowValue('');
  };

  // Alternative PDF Generation using HTML to Canvas
  const generatePDFAlternative = () => {
    try {
      console.log('Starting alternative PDF generation...');

      if (!pdfTableData || pdfTableData.length === 0) {
        alert('No data available to generate PDF');
        return;
      }

      // Create HTML content with proper Arabic support
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Arial Unicode MS', Arial, sans-serif;
              direction: rtl;
              text-align: right;
              margin: 20px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              direction: ltr;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #2d3748;
            }
            .date {
              font-size: 14px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              direction: rtl;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: right;
              direction: rtl;
            }
            th {
              background-color: #2d3748;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .arabic-text {
              font-size: 14px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Arabic Document Data Extraction</div>
            <div class="date">Generated: ${new Date().toLocaleDateString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>القيمة</th>
                <th>الحقل</th>
              </tr>
            </thead>
            <tbody>
              ${pdfTableData.map(row => `
                <tr>
                  <td class="arabic-text">${row.value || 'غير متوفر'}</td>
                  <td class="arabic-text">${row.key || 'غير متوفر'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create a new window and print
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };




  const handleDownloadResults = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${result.filename}_analysis.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Extract Arabic text from HTML
  const extractTextFromHTML = (htmlText) => {
    if (!htmlText) return '';
    // Remove HTML tags and decode entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getFieldTypeColor = (type) => {
    switch (type) {
      case 'date':
        return 'bg-blue-100 text-blue-800';
      case 'number':
        return 'bg-purple-100 text-purple-800';
      case 'classification':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Combine all extracted data from all pages
  const combineExtractedData = () => {
    if (!result.pages || result.pages.length === 0) return {};

    const combined = {};

    result.pages.forEach((page, index) => {
      let dataToUse = page.agent_result?.extracted_data;

      // Use reanalyzed data for the selected page if available
      if (index === selectedPage && reanalyzedData) {
        dataToUse = reanalyzedData;
      }

      if (dataToUse) {
        Object.entries(dataToUse).forEach(([key, value]) => {
          // Include all values, but filter out truly empty ones
          if (value !== undefined && value !== null && value !== '' &&
              value !== 'undefined' && value !== 'null') {
            // Convert arrays to readable format
            if (Array.isArray(value)) {
              combined[key] = value.length > 0 ? value.join(', ') : 'غير متوفر';
            } else {
              combined[key] = value;
            }
          }
        });
      }
    });

    // Apply any manually edited field values
    Object.entries(editedFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        combined[key] = value;
      }
    });

    return combined;
  };

  // Combine all extracted text from all pages
  const combineExtractedText = () => {
    if (!result.pages || result.pages.length === 0) return '';

    return result.pages
      .filter(page => page.ocr_result?.text)
      .map(page => extractTextFromHTML(page.ocr_result.text))
      .join('\n\n')
      .trim();
  };

  // Map Arabic keys to English labels
  const getEnglishLabel = (arabicKey) => {
    const keyMap = {
      'رقم_المستند': 'Document Number',
      'التاريخ_الميلادي': 'Gregorian Date',
      'التاريخ_الهجري': 'Hijri Date',
      'نوع_الوثيقة': 'Document Type',
      'الجهة_الصادرة': 'Issuing Entity',
      'الجهة_المستقبلة': 'Receiving Entity',
      'الأسماء_الشخصية': 'Person Names',
      'المؤلف_المسؤول': 'Author/Signatory',
      'التصنيف': 'Classification',
      'الموقع_الجغرافي': 'Locations',
      'المؤسسات': 'Organizations',
      'الأرقام_المهمة': 'Key Numbers',
      'الخدمة': 'Service',
      'المدير_المسؤول': 'Manager Name',
      'الفئة': 'Category',
      'التوقيع': 'Signature',
      'الموضوع_الرئيسي': 'Main Topic',
      'معلومات_إضافية': 'Additional Information',
      // Legacy mappings for backward compatibility
      'اسم_الشخص': 'Person Name',
      'اسم_الشخص_1': 'Person Name',
      'اسم_الشخص_2': 'Author/Signatory',
      'المنظمة': 'Organization',
      'وزارة_الداخلية': 'Issuing Entity',
      'مدينة_الرياض': 'Location',
      'مدينة_جدة': 'Location',
      'رقم_الهوية': 'ID Number',
      'رقم_الجواز': 'Passport Number',
      'مالك_العنوان': 'Title Owner',
      'الموقع': 'Locations',
      'المنظمات': 'Organizations',
      'حالة_الوثيقة': 'Document Status',
      'ملخص_المحتوى': 'Content Summary'
    };

    return keyMap[arabicKey] || arabicKey.replace(/_/g, ' ');
  };

  // Initialize PDF table data from extracted data
  useEffect(() => {
    if (result && result.pages) {
      // Use the existing combineExtractedData function
      const combinedData = combineExtractedData();

      // Convert to table format with Arabic keys
      const tableData = Object.entries(combinedData).map(([key, value]) => ({
        id: Date.now() + Math.random(),
        key: translateToArabic(key),
        value: value
      }));

      setPdfTableData(tableData);
    }
  }, [result]); // Only depend on result to prevent infinite loops

  const combinedData = combineExtractedData();
  const combinedText = combineExtractedText();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                Processing Complete
              </h2>
              <p className="text-text-secondary">
                {result.filename} • {result.summary?.total_pages || result.pages?.length || 1} page{(result.summary?.total_pages || result.pages?.length || 1) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadResults}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onReset}
              className="btn-primary flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Process New</span>
            </button>
          </div>
        </div>

        {/* Quick Stats - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Processing Time</span>
            </div>
            <div className="text-xl font-bold text-blue-900 mt-1">
              {apiService.formatProcessingTime(result.summary?.total_processing_time || result.pages?.[0]?.processing_time || 0)}
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Pages Processed</span>
            </div>
            <div className="text-xl font-bold text-orange-900 mt-1">
              {result.summary?.successful_pages || result.pages?.length || 1}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8">
            <button
              onClick={() => setActiveTab('entities')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'entities'
                  ? 'border-emerald text-emerald'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              PDF Table
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'insights'
                  ? 'border-emerald text-emerald'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Document Insights
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'text'
                  ? 'border-emerald text-emerald'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Extracted Text
            </button>
          </nav>
        </div>

        <div className="p-8">
          {/* PDF Table Tab */}
          {activeTab === 'entities' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-primary">
                  Extracted Table
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-text-secondary">
                    {pdfTableData.length} rows
                  </span>
                  <button
                    onClick={generatePDFAlternative}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Print Arabic PDF</span>
                  </button>
                </div>
              </div>

              {/* PDF Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          المفتاح (Key)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          القيمة (Value)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pdfTableData.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          {editingRow === row.id ? (
                            <>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={newRowKey}
                                  onChange={(e) => setNewRowKey(e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  dir="rtl"
                                  placeholder="أدخل المفتاح..."
                                />
                              </td>
                              <td className="px-6 py-4">
                                <textarea
                                  value={newRowValue}
                                  onChange={(e) => setNewRowValue(e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  rows="2"
                                  dir="rtl"
                                  placeholder="أدخل القيمة..."
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={handleSaveRow}
                                    className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                    title="Save"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelRowEdit}
                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900" dir="rtl">
                                {row.key}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900" dir="rtl">
                                {row.value}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleEditRow(row.id, row.key, row.value)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRow(row.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {/* Add New Row */}
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={newRowKey}
                            onChange={(e) => setNewRowKey(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            dir="rtl"
                            placeholder="أدخل مفتاح جديد..."
                          />
                        </td>
                        <td className="px-6 py-4">
                          <textarea
                            value={newRowValue}
                            onChange={(e) => setNewRowValue(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            rows="2"
                            dir="rtl"
                            placeholder="أدخل القيمة..."
                          />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={handleAddRow}
                            className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Row</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {pdfTableData.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-text-primary mb-2">
                    No Data Available
                  </h4>
                  <p className="text-text-secondary">
                    Add rows to the table to generate a PDF document.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Document Analysis & Insights
              </h3>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-text-primary mb-4">Processing Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Total Pages</span>
                      <span className="font-medium text-text-primary">
                        {result.summary?.total_pages || result.pages?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Processing Time</span>
                      <span className="font-medium text-text-primary">
                        {apiService.formatProcessingTime(result.summary?.total_processing_time || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Fields Extracted</span>
                      <span className="font-medium text-text-primary">
                        {Object.keys(combinedData).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-text-primary mb-4">Document Classification</h4>
                  <div className="space-y-3">
                    {combinedData['نوع_الوثيقة'] && combinedData['نوع_الوثيقة'] !== 'غير محدد' && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Document Type</span>
                        <span className="font-medium text-text-primary" dir="rtl">
                          {combinedData['نوع_الوثيقة']}
                        </span>
                      </div>
                    )}
                    {combinedData['التصنيف'] && combinedData['التصنيف'] !== 'غير محدد' && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Classification</span>
                        <span className="font-medium text-text-primary" dir="rtl">
                          {combinedData['التصنيف']}
                        </span>
                      </div>
                    )}
                    {combinedData['الفئة'] && combinedData['الفئة'] !== 'غير محدد' && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Category</span>
                        <span className="font-medium text-text-primary" dir="rtl">
                          {combinedData['الفئة']}
                        </span>
                      </div>
                    )}
                    {/* Show a message if no classification data is available */}
                    {(!combinedData['نوع_الوثيقة'] || combinedData['نوع_الوثيقة'] === 'غير محدد') &&
                     (!combinedData['التصنيف'] || combinedData['التصنيف'] === 'غير محدد') &&
                     (!combinedData['الفئة'] || combinedData['الفئة'] === 'غير محدد') && (
                      <div className="text-center py-4">
                        <span className="text-text-secondary text-sm">
                          Document classification will appear here after processing
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* Extracted Text Tab */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-primary">
                  Extracted Text
                </h3>
                <div className="flex items-center space-x-3">
                  {!editingText && (
                    <button
                      onClick={handleEditText}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit & Re-extract</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyText(combinedText)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Text</span>
                  </button>
                </div>
              </div>

              {/* Text editing interface */}
              {editingText ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Edit3 className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Edit OCR Text</h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      Make corrections to the extracted text below, then click "Save & Update Extraction" to re-analyze with the LLM.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg">
                    <textarea
                      value={editedOcrText}
                      onChange={(e) => setEditedOcrText(e.target.value)}
                      className="w-full h-64 p-4 border-0 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter or edit the Arabic text here..."
                      dir="rtl"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-text-secondary">
                      {editedOcrText.length} characters
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleCancelEdit}
                        className="btn-secondary flex items-center space-x-2"
                        disabled={isReanalyzing}
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleReanalyze}
                        className="btn-primary flex items-center space-x-2"
                        disabled={isReanalyzing || !editedOcrText.trim()}
                      >
                        {isReanalyzing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>{isReanalyzing ? 'Re-analyzing...' : 'Save & Update Extraction'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Combined text display */
                combinedText ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {reanalyzedData && (
                      <div className="bg-green-50 border-b border-green-200 px-6 py-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Text has been edited and re-analyzed. Updated results are displayed above.
                          </span>
                        </div>
                      </div>
                    )}
                    <div
                      className="bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleSection('combined-text')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-semibold text-text-primary">
                            Arabic Text {reanalyzedData && '(Edited)'}
                          </h4>
                          <span className="text-sm text-text-secondary">
                            {combinedText.length} characters
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          {expandedSections['combined-text'] ?
                            <ChevronUp className="w-5 h-5 text-text-secondary" /> :
                            <ChevronDown className="w-5 h-5 text-text-secondary" />
                          }
                        </div>
                      </div>
                    </div>

                    {expandedSections['combined-text'] && (
                      <div className="p-6">
                        <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                          <div
                            className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap"
                            dir="rtl"
                          >
                            {combinedText}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-text-primary mb-2">
                      No Text Available
                    </h4>
                    <p className="text-text-secondary">
                      No text was extracted from the document.
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentResults;
