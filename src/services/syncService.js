import { getOrders, saveOrders } from '../services/OrderService';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
  }

  async syncWithBackend() {
    if (this.isSyncing) return;
    
    try {
      this.isSyncing = true;
      const localOrders = getOrders();
      
      // Здесь будет логика синхронизации с бэкендом
      // 1. Получить данные с сервера
      // 2. Сравнить с локальными данными
      // 3. Объединить изменения
      // 4. Сохранить обновленные данные
      
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
      saveOrders([...getOrders(), order]);
      
      // Синхронизируем с бэкендом
      await this.syncWithBackend();
      
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении и синхронизации:', error);
      return false;
    }
  }
}

export const syncService = new SyncService(); 