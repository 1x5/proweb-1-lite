require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sequelize = require('./db/connection');
const orderRoutes = require('./routes/orderRoutes');
const { validateOrder } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3001;

// Создаем поток для записи логов
const logStream = fs.createWriteStream(
  path.join(__dirname, '../../logs/app.log'),
  { flags: 'a' }
);

// Функция для логирования
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  logStream.write(logMessage);
};

// Middleware
app.use(cors());
app.use(express.json());

// Логирование всех входящих запросов
app.use((req, res, next) => {
  log('\n=== Входящий запрос ===');
  log(`Метод: ${req.method}`);
  log(`Путь: ${req.path}`);
  log(`Заголовки: ${JSON.stringify(req.headers, null, 2)}`);
  log(`Тело запроса: ${JSON.stringify(req.body, null, 2)}`);
  log(`Параметры запроса: ${JSON.stringify(req.query, null, 2)}`);
  
  // Сохраняем оригинальные методы
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Переопределяем res.send
  res.send = function(body) {
    log('\n=== Исходящий ответ ===');
    log(`Статус: ${res.statusCode}`);
    log(`Тело ответа: ${body}`);
    return originalSend.call(this, body);
  };
  
  // Переопределяем res.json
  res.json = function(body) {
    log('\n=== Исходящий ответ ===');
    log(`Статус: ${res.statusCode}`);
    log(`Тело ответа: ${JSON.stringify(body, null, 2)}`);
    return originalJson.call(this, body);
  };
  
  next();
});

// Routes
app.use('/api/orders', orderRoutes);

// Global error handler
app.use((err, req, res, next) => {
  log(`❌ Ошибка: ${err.message}`);
  log(`Стек: ${err.stack}`);
  res.status(500).json({ error: err.message });
});

// Подключение к базе данных и запуск сервера
sequelize.authenticate()
  .then(() => {
    log('Успешное подключение к базе данных.');
    return sequelize.sync();
  })
  .then(() => {
    log('Database synced');
    app.listen(PORT, () => {
      log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    log(`Ошибка: ${err.message}`);
  }); 