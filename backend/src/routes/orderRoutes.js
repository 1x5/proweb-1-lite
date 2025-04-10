const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Получить все заказы
router.get('/', orderController.getAllOrders);

// Получить заказ по ID
router.get('/:id', orderController.getOrderById);

// Создать новый заказ
router.post('/', orderController.createOrder);

// Обновить заказ
router.put('/:id', orderController.updateOrder);

// Удалить заказ
router.delete('/:id', orderController.deleteOrder);

// Синхронизация заказов
router.post('/sync', orderController.syncOrders);

module.exports = router; 