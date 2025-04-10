import { getOrders, saveOrders } from './OrderService';
import { apiService } from './apiService';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];

    // Слушаем изменения состояния сети
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    this.isOnline = true;
    // При восстановлении соединения синхронизируем накопленные изменения
    if (this.offlineQueue.length > 0) {
      this.processOfflineQueue();
    }
  }

  handleOffline() {
    this.isOnline = false;
  }

  async processOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    try {
      // Обрабатываем каждое действие из очереди
      for (const action of this.offlineQueue) {
        await this.syncWithBackend();
      }
      // Очищаем очередь после успешной синхронизации
      this.offlineQueue = [];
    } catch (error) {
      console.error('Ошибка при обработке офлайн очереди:', error);
    }
  }

  async syncWithBackend() {
    if (this.isSyncing) return;
    
    try {
      this.isSyncing = true;
      
      if (!this.isOnline) {
        console.log('Нет подключения к интернету. Синхронизация отложена.');
        return false;
      }
      
      // Получаем локальные заказы
      const localOrders = getOrders();
      
      // Синхронизируем с бэкендом
      const serverOrders = await apiService.syncOrders(localOrders);
      
      // Обновляем локальное хранилище
      saveOrders(serverOrders);
      
      this.lastSyncTime = new Date();
      return true;
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      if (!this.isOnline) {
        // Добавляем в очередь для последующей синхронизации
        this.offlineQueue.push({ type: 'sync', timestamp: new Date() });
      }
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  async syncOnSave(order) {
    try {
      // Сохраняем локально
      const localOrders = getOrders();
      const updatedLocalOrders = [...localOrders, order];
      saveOrders(updatedLocalOrders);
      
      if (!this.isOnline) {
        // Если нет подключения, добавляем в очередь
        this.offlineQueue.push({ 
          type: 'save', 
          order, 
          timestamp: new Date() 
        });
        return true;
      }
      
      // Синхронизируем с бэкендом
      await this.syncWithBackend();
      
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении и синхронизации:', error);
      return false;
    }
  }

  startAutoSync(interval = 300000) {
    // Очищаем предыдущий интервал, если он был
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Устанавливаем новый интервал
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
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