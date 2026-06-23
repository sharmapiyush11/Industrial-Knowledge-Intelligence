#!/bin/bash
echo "=============================================="
echo "  Starting Industrial Brain AI Local Stack..."
echo "=============================================="

# Start Backend in background
echo "Starting FastAPI Backend (uvicorn)..."
cd backend && python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Start Frontend
echo "Starting Next.js Frontend (npm run dev)..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "Both services are running!"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://127.0.0.1:8000/docs"
echo "Press Ctrl+C to stop both services."

# Handle shutdown of background processes on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}
trap cleanup SIGINT SIGTERM

wait
