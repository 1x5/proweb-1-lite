import { getOrders, saveOrders } from './OrderService';
import { apiService } from './apiService';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;
    this.retryDelay = 5000; // 5 секунд

    // Загружаем сохраненную очередь из localStorage
    const savedQueue = localStorage.getItem('offlineQueue');
    if (savedQueue) {
      try {
        this.offlineQueue = JSON.parse(savedQueue);
      } catch (error) {
        console.error('Ошибка при загрузке очереди:', error);
        this.offlineQueue = [];
      }
    }

    // Слушаем изменения состояния сети
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    this.isOnline = true;
    this.retryAttempts = 0; // Сбрасываем счетчик попыток при восстановлении соединения
    // При восстановлении соединения синхронизируем накопленные изменения
    if (this.offlineQueue.length > 0) {
      this.processOfflineQueue();
    }
  }

  handleOffline() {
    this.isOnline = false;
    // Сохраняем очередь в localStorage
    this.saveOfflineQueue();
  }

  saveOfflineQueue() {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Ошибка при сохранении очереди:', error);
    }
  }

  async processOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    try {
      // Создаем копию очереди
      const queueCopy = [...this.offlineQueue];
      
      // Обрабатываем каждое действие из очереди
      for (const action of queueCopy) {
        try {
          if (action.type === 'save') {
            await this.syncOnSave(action.order);
          } else {
            await this.syncWithBackend();
          }
          // Удаляем успешно обработанное действие из очереди
          this.offlineQueue = this.offlineQueue.filter(item => item !== action);
          this.saveOfflineQueue();
        } catch (error) {
          console.error('Ошибка при обработке действия:', error);
          // Продолжаем с следующим действием
          continue;
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке офлайн очереди:', error);
    }
  }

  async syncWithBackend() {
    if (this.isSyncing) return false;
    
    try {
      this.isSyncing = true;
      
      if (!this.isOnline) {
        console.log('Нет подключения к интернету. Синхронизация отложена.');
        return false;
      }
      
      // Получаем локальные заказы
      const { orders: localOrders } = getOrders();
      
      // Синхронизируем с бэкендом
      const serverOrders = await apiService.syncOrders(localOrders);
      
      // Обновляем локальное хранилище
      await saveOrders(serverOrders);
      
      this.lastSyncTime = new Date();
      this.retryAttempts = 0; // Сбрасываем счетчик попыток при успешной синхронизации
      return true;
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      
      if (!this.isOnline) {
        // Добавляем в очередь для последующей синхронизации
        this.offlineQueue.push({ 
          type: 'sync', 
          timestamp: new Date() 
        });
        this.saveOfflineQueue();
      } else if (this.retryAttempts < this.maxRetryAttempts) {
        // Пробуем повторить синхронизацию через некоторое время
        this.retryAttempts++;
        setTimeout(() => {
          this.syncWithBackend();
        }, this.retryDelay * this.retryAttempts);
      }
      
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  async syncOnSave(order) {
    try {
      // Если нет подключения, добавляем в очередь и сохраняем локально
      if (!this.isOnline) {
        this.offlineQueue.push({ 
          type: 'save', 
          order, 
          timestamp: new Date() 
        });
        this.saveOfflineQueue();
        return false;
      }
      
      // Пытаемся синхронизировать с сервером
      try {
        // Получаем актуальные данные с сервера
        const serverOrders = await apiService.syncOrders([order]);
        
        // Обновляем локальное хранилище с учетом серверных данных
        const { orders: localOrders } = getOrders();
        const updatedOrders = localOrders.map(localOrder => {
          const serverOrder = serverOrders.find(so => so.id === localOrder.id);
          return serverOrder || localOrder;
        });
        
        await saveOrders(updatedOrders);
        this.lastSyncTime = new Date();
        return true;
      } catch (error) {
        console.error('Ошибка синхронизации с сервером:', error);
        
        // Если произошла ошибка, добавляем в очередь для повторной попытки
        this.offlineQueue.push({ 
          type: 'save', 
          order, 
          timestamp: new Date() 
        });
        this.saveOfflineQueue();
        
        // Пробуем повторить синхронизацию позже
        if (this.retryAttempts < this.maxRetryAttempts) {
          this.retryAttempts++;
          setTimeout(() => {
            this.syncOnSave(order);
          }, this.retryDelay * this.retryAttempts);
        }
        
        return false;
      }
    } catch (error) {
      console.error('Ошибка при сохранении и синхронизации:', error);
      return false;
    }
  }

  startAutoSync(interval = 300000) { // 5 минут по умолчанию
    // Очищаем предыдущий интервал, если он был
    this.stopAutoSync();
    
    // Устанавливаем новый интервал
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncWithBackend();
      }
    }, interval);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncService = new SyncService(); 