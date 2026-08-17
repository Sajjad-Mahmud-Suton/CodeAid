@echo off
echo Starting CodeAid Project...

echo Starting Backend...
start cmd /k "cd backend && npx tsc && node dist/server.js"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo Project is starting! Please wait a few seconds and then open http://localhost:5173 in your browser.
pause
