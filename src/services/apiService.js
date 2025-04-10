const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 5000;

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const withRetry = async (fn, retries = MAX_RETRIES) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error.name === 'AbortError' || error.message.includes('Network'))) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
};

export const apiService = {
  // Получить все заказы
  async getAllOrders() {
    return withRetry(async () => {
      const response = await fetchWithTimeout(`${API_URL}/orders`);
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return await response.json();
    });
  },

  // Получить заказ по ID
  async getOrderById(id) {
    return withRetry(async () => {
      const response = await fetchWithTimeout(`${API_URL}/orders/${id}`);
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return await response.json();
    });
  },

  // Создать заказ
  async createOrder(order) {
    return withRetry(async () => {
      const response = await fetchWithTimeout(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return await response.json();
    });
  },

  // Обновить заказ
  async updateOrder(id, order) {
    return withRetry(async () => {
      const response = await fetchWithTimeout(`${API_URL}/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return await response.json();
    });
  },

  // Удалить заказ
  async deleteOrder(id) {
    return withRetry(async () => {
      const response = await fetchWithTimeout(`${API_URL}/orders/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return true;
    });
  },

  // Синхронизация заказов
  async syncOrders(orders) {
    console.log('🟨 =====================================');
    console.log('🟨 НАЧАЛО ОТПРАВКИ НА СЕРВЕР');
    console.log('🟨 =====================================');
    
    console.log('📤 ОТПРАВЛЯЕМЫЕ ДАННЫЕ:');
    console.log(JSON.stringify(orders, null, 2));
    
    try {
      const response = await fetchWithTimeout(`${API_URL}/orders/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders }),
      });
      
      if (!response.ok) {
        console.log('❌ ОШИБКА СЕРВЕРА:');
        console.log('Статус:', response.status);
        console.log('Текст ошибки:', response.statusText);
        const errorData = await response.json();
        console.log('Детали:', errorData);
        throw new Error('Ошибка синхронизации с сервером');
      }
      
      const data = await response.json();
      console.log('✅ СИНХРОНИЗАЦИЯ УСПЕШНА');
      console.log('📥 ОТВЕТ СЕРВЕРА:', data);
      return data;
    } catch (error) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
      throw error;
    }
  },
}; 