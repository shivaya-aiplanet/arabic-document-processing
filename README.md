# Arabic Document Processing System

A comprehensive system for processing Arabic government documents using OCR and AI-powered data extraction.

## Features

- **Multi-format Support**: Process PDF, PNG, JPG, and JPEG files
- **Advanced OCR**: Integration with QARI OCR for high-quality Arabic text extraction
- **AI-Powered Extraction**: Multi-agent LLM system for intelligent data extraction
- **Handwritten Content Focus**: Specialized extraction of handwritten Arabic content
- **PDF Generation**: Export extracted data as formatted PDF reports
- **Real-time Processing**: Fast document processing with progress tracking
- **Professional UI**: Clean, responsive interface with Arabic text support

## Architecture

### Backend (FastAPI)
- **OCR Integration**: QARI OCR service for Arabic text recognition
- **Multi-Agent System**: Specialized agents for extraction, review, and classification
- **LLM Integration**: Groq API for advanced language processing
- **File Processing**: Support for multiple document formats

### Frontend (React)
- **Modern UI**: Professional interface with Tailwind CSS
- **File Upload**: Drag-and-drop document upload
- **Real-time Results**: Live processing status and results display
- **PDF Export**: Client-side PDF generation with jsPDF
- **Responsive Design**: Mobile-friendly interface

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/shivaya-aiplanet/arabic-document-processing.git
cd arabic-document-processing

# Run automated setup
./setup.sh

# Edit .env with your API keys
nano .env

# Start both services
./start.sh
```

### Option 2: Manual Setup

#### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

#### Backend Setup

1. **Clone and navigate:**
```bash
git clone https://github.com/shivaya-aiplanet/arabic-document-processing.git
cd arabic-document-processing
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install backend dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

4. **Configure environment:**
```bash
cd ..
cp .env.example .env
# Edit .env with your API keys (see configuration section below)
```

5. **Start the backend:**
```bash
cd backend
python main.py
```
Backend will be available at: `http://localhost:8000`

#### Frontend Setup

1. **Install frontend dependencies:**
```bash
cd professional_frontend
npm install
```

2. **Start the frontend:**
```bash
npm start
```
Frontend will be available at: `http://localhost:3000`

## Running the System

### Method 1: Using Start Script
```bash
./start.sh
```

### Method 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd professional_frontend
npm start
```

### Verify Installation
- Backend Health: `http://localhost:8000/health`
- Frontend: `http://localhost:3000`
- API Documentation: `http://localhost:8000/docs`

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Required API Keys
GROQ_API_KEY=your_groq_api_key_here
RUNPOD_QARI_URL=https://your-runpod-endpoint.proxy.runpod.net

# Optional Configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000
MAX_FILE_SIZE=50MB
```

### API Keys Setup

#### 1. Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

#### 2. QARI OCR Setup
1. Deploy QARI on RunPod:
   - Use the QARI Docker image
   - Set up a serverless endpoint
   - Get the endpoint URL
2. Add the URL to your `.env` file

#### 3. Environment File Example
```env
# Copy this to .env and fill in your values
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
RUNPOD_QARI_URL=https://your-actual-runpod-endpoint.proxy.runpod.net
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_PORT=3000
MAX_FILE_SIZE=50MB
DEBUG=true
```

## Usage

1. **Start Services**:
   - Backend: `cd backend && python main.py`
   - Frontend: `cd professional_frontend && npm start`

2. **Access Application**: Open `http://localhost:3000`

3. **Process Documents**:
   - Upload Arabic government documents (PDF/Images)
   - View extracted data in structured format
   - Edit and validate results
   - Export as PDF report

## API Endpoints

### Core Endpoints
- `POST /upload` - Upload and process documents
- `GET /health` - System health check
- `POST /reanalyze` - Re-process with edited OCR text

### Response Format
```json
{
  "pages": [
    {
      "page_number": 1,
      "ocr_result": {
        "text": "extracted_arabic_text",
        "confidence": 0.95
      },
      "agent_result": {
        "extracted_data": {
          "رقم_المستند": "123-456-789",
          "التاريخ": "15/01/2024",
          "الاسم_الرئيسي": "محمد أحمد",
          "الجهة_الصادرة": "وزارة الداخلية"
        }
      }
    }
  ]
}
```

## Development

### Project Structure
```
arabic-document-processing/
├── backend/                 # FastAPI backend
│   ├── agents/             # Multi-agent system
│   ├── utils/              # Utility functions
│   ├── main.py            # Main application
│   └── requirements.txt   # Python dependencies
├── professional_frontend/  # React frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

#### Backend Issues
```bash
# Port already in use
lsof -i :8000
kill -9 <PID>

# Dependencies issues
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# Python path issues
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

#### Frontend Issues
```bash
# Node modules issues
rm -rf node_modules package-lock.json
npm install

# Port already in use
lsof -i :3000
kill -9 <PID>

# Clear npm cache
npm cache clean --force
```

#### API Connection Issues
- Verify backend is running: `curl http://localhost:8000/health`
- Check .env file configuration
- Ensure API keys are valid
- Check network connectivity

### Performance Tips
- Use smaller image files for faster processing
- Ensure good image quality for better OCR results
- Monitor system resources during processing

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints
- Check troubleshooting section above

## Acknowledgments

- QARI OCR for Arabic text recognition
- Groq for LLM processing
- FastAPI and React communities
- Contributors and testers
