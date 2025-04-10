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
    console.log('📤 Создание нового заказа:', order);
    const response = await fetchWithTimeout(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
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
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log('🔄 Отправка заказов на синхронизацию:', orders);
        const response = await fetch(`${API_URL}/orders/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ orders })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Ошибка синхронизации:', errorData);
          
          // Если это временная ошибка (5xx), пробуем еще раз
          if (response.status >= 500 && retryCount < maxRetries - 1) {
            retryCount++;
            console.log(`🔄 Повторная попытка ${retryCount}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }
          
          throw new Error(errorData.message || 'Ошибка синхронизации');
        }

        const data = await response.json();
        console.log('✅ Синхронизация успешна:', data);
        return data;
      } catch (error) {
        console.error('❌ Ошибка при синхронизации:', error);
        
        // Если это сетевая ошибка, пробуем еще раз
        if (error.message.includes('NetworkError') && retryCount < maxRetries - 1) {
          retryCount++;
          console.log(`🔄 Повторная попытка ${retryCount}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
        
        throw error;
      }
    }
  },
}; 