const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const orderController = require('../controllers/orderController');
const { validateOrder } = require('../middleware/validation');

// Логирование всех запросов
router.use((req, res, next) => {
  console.log('Order Route:', {
    method: req.method,
    path: req.path,
    body: req.body
  });
  next();
});

// Маршрут для обработки логов
router.post('/logs', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const logPath = path.join(__dirname, '../../logs/app.log');
  fs.appendFile(logPath, message, (err) => {
    if (err) {
      console.error('Ошибка при записи лога:', err);
      return res.status(500).json({ error: 'Failed to write log' });
    }
    res.json({ success: true });
  });
});

// Синхронизация заказов (должен быть перед /:id)
router.post('/sync', validateOrder, orderController.syncOrders);

// Получить все заказы
router.get('/', orderController.getAllOrders);

// Создать новый заказ
router.post('/', orderController.createOrder);

// Получить заказ по ID
router.get('/:id', orderController.getOrderById);

// Обновить заказ
router.put('/:id', orderController.updateOrder);

// Удалить заказ
router.delete('/:id', orderController.deleteOrder);

module.exports = router; 