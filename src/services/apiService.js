const API_URL = process.env.REACT_APP_API_URL || 'http://94.228.126.132:3001/api';

export const apiService = {
  // Получить все заказы
  async getAllOrders() {
    try {
      const response = await fetch(`${API_URL}/orders`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Получить заказ по ID
  async getOrderById(id) {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Создать заказ
  async createOrder(order) {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Обновить заказ
  async updateOrder(id, order) {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Удалить заказ
  async deleteOrder(id) {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },

  // Синхронизировать заказы
  async syncOrders(orders) {
    try {
      const response = await fetch(`${API_URL}/orders/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error syncing orders:', error);
      throw error;
    }
  },
}; 