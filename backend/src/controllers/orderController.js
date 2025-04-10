const Order = require('../models/Order');

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
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить заказ
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    await order.update(req.body);
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    console.log('=== Начало синхронизации ===');
    console.log('Заголовки запроса:', req.headers);
    console.log('Метод запроса:', req.method);
    console.log('Путь запроса:', req.path);
    console.log('Тело запроса:', JSON.stringify(req.body, null, 2));

    let orders = req.body.orders;
    
    // Проверяем, что orders существует и является массивом
    if (!orders) {
      console.log('Ошибка: orders не определен');
      return res.status(400).json({ 
        error: 'Orders is required',
        receivedBody: req.body 
      });
    }
    
    if (!Array.isArray(orders)) {
      console.log('Преобразуем orders в массив');
      orders = [orders];
    }

    console.log('Количество полученных заказов:', orders.length);
    
    try {
      // Получаем все существующие заказы
      const existingOrders = await Order.findAll();
      const existingIds = existingOrders.map(order => order.id);
      console.log('Существующие ID заказов:', existingIds);
      
      // Разделяем заказы на новые и обновляемые
      const ordersToUpdate = orders.filter(order => existingIds.includes(order.id));
      const ordersToCreate = orders.filter(order => !existingIds.includes(order.id));
      console.log('Заказы для обновления:', ordersToUpdate.length);
      console.log('Заказы для создания:', ordersToCreate.length);
      
      // Создаем новые заказы
      if (ordersToCreate.length > 0) {
        console.log('Создаем новые заказы:', ordersToCreate);
        await Order.bulkCreate(ordersToCreate);
      }
      
      // Обновляем существующие заказы
      for (const order of ordersToUpdate) {
        console.log('Обновляем заказ:', order.id);
        await Order.update(order, {
          where: { id: order.id }
        });
      }
      
      // Возвращаем обновленный список заказов
      const updatedOrders = await Order.findAll();
      console.log('Отправляем обновленный список заказов:', updatedOrders.length);
      console.log('=== Конец синхронизации ===');
      res.json(updatedOrders);
    } catch (dbError) {
      console.error('Ошибка базы данных:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Ошибка синхронизации заказов:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 