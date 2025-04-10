import { getOrders, saveOrders } from './OrderService';
import { apiService } from './apiService';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
  }

  async syncWithBackend() {
    if (this.isSyncing) return;
    
    try {
      this.isSyncing = true;
      
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
      
      // Синхронизируем с бэкендом
      await this.syncWithBackend();
      
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении и синхронизации:', error);
      return false;
    }
  }

  // Запускаем автоматическую синхронизацию каждые 5 минут
  startAutoSync(interval = 300000) {
    setInterval(() => {
      this.syncWithBackend();
    }, interval);
  }
}

export const syncService = new SyncService(); 