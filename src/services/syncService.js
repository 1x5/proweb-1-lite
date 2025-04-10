import { getOrders, saveOrders } from './OrderService';
import { apiService } from './apiService';

class SyncService {
  constructor() {
    console.log('🔄 Инициализация SyncService...');
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
    this.isOnline = navigator.onLine;
    this.offlineQueue = this.loadOfflineQueue();
    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;
    this.retryDelay = 5000; // 5 секунд

    // Слушаем изменения состояния сети
    window.addEventListener('online', () => {
      console.log('🌐 Соединение восстановлено');
      this.handleOnline();
    });
    
    window.addEventListener('offline', () => {
      console.log('❌ Соединение потеряно');
      this.handleOffline();
    });
  }

  handleOnline = async () => {
    console.log('🟢 Соединение восстановлено');
    this.isOnline = true;
    this.startAutoSync();
    
    try {
      // Показываем статус синхронизации
      if (this.onSyncStatusChange) {
        this.onSyncStatusChange('syncing');
      }
      
      const result = await this.processOfflineQueue();
      
      if (this.onSyncStatusChange) {
        this.onSyncStatusChange(result ? 'success' : 'error');
      }
      
      // Скрываем статус через 2 секунды
      setTimeout(() => {
        if (this.onSyncStatusChange) {
          this.onSyncStatusChange(null);
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Ошибка при синхронизации после восстановления соединения:', error);
      if (this.onSyncStatusChange) {
        this.onSyncStatusChange('error');
      }
    }
  };

  handleOffline() {
    console.log('💾 Сохранение очереди в офлайн режиме...');
    this.isOnline = false;
    this.saveOfflineQueue();
  }

  loadOfflineQueue() {
    console.log('📥 Загрузка офлайн очереди...');
    const queue = localStorage.getItem('offlineQueue');
    return queue ? JSON.parse(queue) : [];
  }

  saveOfflineQueue() {
    console.log('📤 Сохранение офлайн очереди...');
    localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
  }

  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) {
      console.log('✅ Офлайн очередь пуста');
      return;
    }

    console.log(`🔄 Обработка ${this.offlineQueue.length} заказов из офлайн очереди...`);
    
    while (this.offlineQueue.length > 0) {
      const action = this.offlineQueue[0];
      try {
        console.log('📤 Отправка заказа на сервер:', action);
        await this.syncWithBackend([action]);
        this.offlineQueue.shift();
        this.saveOfflineQueue();
        console.log('✅ Заказ успешно синхронизирован');
      } catch (error) {
        console.error('❌ Ошибка при синхронизации заказа:', error);
        break;
      }
    }
  }

  async syncWithBackend(orders) {
    if (this.isSyncing) {
      console.log('⏳ Синхронизация уже выполняется...');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Начало синхронизации с сервером...');

    try {
      const result = await apiService.syncOrders(orders);
      this.lastSyncTime = new Date();
      console.log('✅ Синхронизация успешно завершена:', result);
      return result;
    } catch (error) {
      console.error('❌ Ошибка при синхронизации:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  async syncOnSave(order) {
    console.log('🟦 =====================================');
    console.log('🟦 НАЧАЛО СИНХРОНИЗАЦИИ ПРИ СОХРАНЕНИИ');
    console.log('🟦 Заказ:', order.id, order.name);
    console.log('🟦 =====================================');
    
    if (!navigator.onLine) {
      console.log('📱 ОФЛАЙН РЕЖИМ - добавление в очередь');
      this.offlineQueue.push(order);
      this.saveOfflineQueue();
      console.log('💾 Заказ добавлен в офлайн очередь');
      return false;
    }

    try {
      console.log('🔄 Отправка на сервер...');
      const result = await this.syncWithBackend([order]);
      console.log('✅ СИНХРОНИЗАЦИЯ УСПЕШНА');
      console.log('📊 Результат:', result);
      return result;
    } catch (error) {
      console.error('❌ ОШИБКА СИНХРОНИЗАЦИИ:', error);
      console.log('📱 Добавление в офлайн очередь...');
      this.offlineQueue.push(order);
      this.saveOfflineQueue();
      console.log('💾 Заказ добавлен в офлайн очередь');
      return false;
    } finally {
      console.log('🟦 =====================================');
      console.log('🟦 КОНЕЦ СИНХРОНИЗАЦИИ ПРИ СОХРАНЕНИИ');
      console.log('🟦 =====================================');
    }
  }

  startAutoSync(interval = 300000) {
    console.log(`⏰ Запуск автоматической синхронизации (интервал: ${interval}мс)`);
    this.syncInterval = setInterval(() => {
      if (this.offlineQueue.length > 0) {
        console.log('🔄 Запуск автоматической синхронизации...');
        this.processOfflineQueue();
      }
    }, interval);
  }

  stopAutoSync() {
    console.log('⏹️ Остановка автоматической синхронизации');
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export default new SyncService(); 