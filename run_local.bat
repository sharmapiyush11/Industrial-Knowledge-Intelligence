@echo off
echo ==============================================
echo   Starting Industrial Brain AI Local Stack...
echo ==============================================

:: Start Backend
echo Starting FastAPI Backend (uvicorn) in a new window...
if exist "C:\Users\parth\AppData\Local\Programs\Python\Python312\python.exe" (
    start "FastAPI Backend" cmd /k "cd backend && C:\Users\parth\AppData\Local\Programs\Python\Python312\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
) else (
    start "FastAPI Backend" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
)

:: Start Frontend
echo Starting Next.js Frontend (npm run dev) in a new window...
start "Next.js Frontend" cmd /k "cd frontend && npm run dev"

echo Both services are spinning up!
echo - Frontend: http://localhost:3000
echo - Backend API: http://127.0.0.1:8000/docs
echo.
pause
