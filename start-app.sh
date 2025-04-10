#!/bin/bash

# Останавливаем существующие процессы
echo "Stopping existing processes..."
pkill -f "node src/index.js" || true
pkill -f "npm start" || true

# Запускаем бэкенд в новом окне терминала
echo "Starting backend..."
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/backend && npm start"'

# Запускаем фронтенд в новом окне терминала
echo "Starting frontend..."
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm start"'

# Запускаем отслеживание логов
echo "Starting log monitoring..."
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && echo \"=== Backend Logs ===\" && tail -f backend/logs/app.log"'
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && echo \"=== Frontend Logs ===\" && tail -f frontend/logs/app.log"'

echo "App started! Please check:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001" 