@echo off
echo Starting LeadEval application...

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo Application started successfully!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
pause 