#!/bin/bash

# Arabic Document Processing System Setup Script

echo "🚀 Setting up Arabic Document Processing System..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Create virtual environment for backend
echo "📦 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd professional_frontend
npm install
cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys before running the system."
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Start backend: cd backend && python main.py"
echo "3. Start frontend: cd professional_frontend && npm start"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "🔑 Required API keys:"
echo "- GROQ_API_KEY: Get from https://console.groq.com/"
echo "- RUNPOD_QARI_URL: Deploy QARI on RunPod"
