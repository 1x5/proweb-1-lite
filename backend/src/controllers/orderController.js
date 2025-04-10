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
    const { orders } = req.body;
    
    // Получаем все существующие заказы
    const existingOrders = await Order.findAll();
    const existingIds = existingOrders.map(order => order.id);
    
    // Разделяем заказы на новые и обновляемые
    const ordersToUpdate = orders.filter(order => existingIds.includes(order.id));
    const ordersToCreate = orders.filter(order => !existingIds.includes(order.id));
    
    // Создаем новые заказы
    if (ordersToCreate.length > 0) {
      await Order.bulkCreate(ordersToCreate);
    }
    
    // Обновляем существующие заказы
    for (const order of ordersToUpdate) {
      await Order.update(order, {
        where: { id: order.id }
      });
    }
    
    // Возвращаем обновленный список заказов
    const updatedOrders = await Order.findAll();
    res.json(updatedOrders);
  } catch (error) {
    console.error('Error syncing orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 