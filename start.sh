#!/bin/bash

# Arabic Document Processing System Start Script

echo "🚀 Starting Arabic Document Processing System..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run setup.sh first."
    exit 1
fi

# Function to start backend
start_backend() {
    echo "🔧 Starting backend server..."
    cd backend
    python main.py &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting frontend server..."
    cd professional_frontend
    npm start &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
    cd ..
}

# Start both services
start_backend
sleep 3
start_frontend

echo ""
echo "✅ System started successfully!"
echo ""
echo "📋 Access points:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- API Health: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait
