const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Логирование всех запросов
router.use((req, res, next) => {
  console.log('Order Route:', {
    method: req.method,
    path: req.path,
    body: req.body
  });
  next();
});

// Синхронизация заказов (должен быть перед /:id)
router.post('/sync', orderController.syncOrders);

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