const Order = require('../models/Order');
const { Op } = require('sequelize');

// Валидация данных заказа
const validateOrder = (order) => {
  console.log('🔍 Валидация заказа:', JSON.stringify(order, null, 2));

  if (!order) {
    console.error('❌ Ошибка: order не определен');
    throw new Error('Order data is required');
  }

  // Обязательные поля для создания/обновления
  const requiredFields = ['name', 'price'];
  const missingFields = requiredFields.filter(field => {
    const value = order[field];
    console.log(`Проверка поля ${field}:`, {
      value,
      type: typeof value,
      isUndefined: value === undefined,
      isNull: value === null,
      isEmpty: value === ''
    });
    return value === undefined || value === null || value === '';
  });
  
  if (missingFields.length > 0) {
    console.error('❌ Отсутствуют обязательные поля:', missingFields);
    throw new Error(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
  }

  // Проверка числовых полей
  const numericFields = ['price', 'cost', 'profit', 'profitPercent', 'balance', 'prepayment'];
  for (const field of numericFields) {
    if (order[field] !== undefined && order[field] !== null && order[field] !== '') {
      const value = parseFloat(order[field]);
      console.log(`Проверка числового поля ${field}:`, {
        original: order[field],
        parsed: value,
        isNaN: isNaN(value)
      });
      if (isNaN(value)) {
        throw new Error(`Поле ${field} должно быть числом, получено: ${order[field]}`);
      }
      order[field] = value; // Преобразуем значение
    }
  }

  // Проверка массивов
  if (order.expenses !== undefined && !Array.isArray(order.expenses)) {
    console.error('❌ Ошибка: expenses не является массивом:', {
      value: order.expenses,
      type: typeof order.expenses
    });
    throw new Error(`Расходы должны быть массивом, получено: ${typeof order.expenses}`);
  }

  if (order.photos !== undefined && !Array.isArray(order.photos)) {
    console.error('❌ Ошибка: photos не является массивом:', {
      value: order.photos,
      type: typeof order.photos
    });
    throw new Error(`Фотографии должны быть массивом, получено: ${typeof order.photos}`);
  }

  console.log('✅ Заказ прошел валидацию');
  return true;
};

// Получить все заказы
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить заказ по ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создать новый заказ
exports.createOrder = async (req, res) => {
  try {
    validateOrder(req.body);
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.message.includes('is required') || error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Обновить заказ
exports.updateOrder = async (req, res) => {
  try {
    validateOrder(req.body);
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    await order.update(req.body);
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.message.includes('is required') || error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Удалить заказ
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    await order.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Синхронизация заказов
exports.syncOrders = async (req, res) => {
  try {
    console.log('🔄 Начало синхронизации заказов');
    console.log('📦 Полученные данные:', JSON.stringify(req.body, null, 2));

    const { orders } = req.body;
    if (!orders || !Array.isArray(orders)) {
      console.error('❌ Неверный формат данных:', req.body);
      return res.status(400).json({ error: 'Неверный формат данных' });
    }

    console.log(`📊 Количество заказов для синхронизации: ${orders.length}`);

    const results = [];
    for (const orderData of orders) {
      try {
        console.log('🔍 Обработка заказа:', {
          id: orderData.id,
          name: orderData.name,
          price: orderData.price,
          status: orderData.status
        });

        validateOrder(orderData);

        let order;
        if (orderData.id) {
          console.log('🔄 Обновление существующего заказа');
          order = await Order.findByPk(orderData.id);
          if (!order) {
            console.error('❌ Заказ не найден:', orderData.id);
            throw new Error('Заказ не найден');
          }
          await order.update(orderData);
        } else {
          console.log('➕ Создание нового заказа');
          order = await Order.create(orderData);
        }

        console.log('✅ Заказ успешно обработан:', {
          id: order.id,
          name: order.name,
          version: order.version
        });

        results.push(order);
      } catch (error) {
        console.error('❌ Ошибка при обработке заказа:', {
          error: error.message,
          orderData
        });
        throw error;
      }
    }

    console.log('✨ Синхронизация завершена успешно');
    res.json(results);
  } catch (error) {
    console.error('❌ Ошибка синхронизации:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
}; 