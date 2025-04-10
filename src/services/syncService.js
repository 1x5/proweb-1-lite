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
    this.statusListeners = new Set();

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

  // Добавляем метод для подписки на изменения статуса
  onSyncStatusChange(callback) {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  // Добавляем метод для уведомления слушателей
  notifyStatusChange(status) {
    this.statusListeners.forEach(callback => callback(status));
  }

  handleOnline = async () => {
    console.log('🟢 Соединение восстановлено');
    this.isOnline = true;
    this.startAutoSync();
    
    try {
      if (this.offlineQueue.length === 0) {
        console.log('✅ Нет заказов для синхронизации');
        return;
      }

      // Показываем статус синхронизации
      this.notifyStatusChange('syncing');
      
      console.log(`🔄 Обработка ${this.offlineQueue.length} заказов из офлайн очереди...`);
      
      const failedOrders = [];
      
      while (this.offlineQueue.length > 0) {
        const order = this.offlineQueue[0];
        let retryCount = 0;
        let success = false;
        
        while (retryCount < this.maxRetryAttempts && !success) {
          try {
            console.log(`📤 Попытка ${retryCount + 1} отправки заказа на сервер:`, order);
            if (order && order.id) {
              await this.syncWithBackend([order]);
              this.offlineQueue.shift();
              this.saveOfflineQueue();
              console.log('✅ Заказ успешно синхронизирован');
              success = true;
            } else {
              console.log('❌ Некорректные данные заказа:', order);
              this.offlineQueue.shift();
              this.saveOfflineQueue();
              break;
            }
          } catch (error) {
            console.error(`❌ Ошибка при синхронизации заказа (попытка ${retryCount + 1}):`, error);
            retryCount++;
            if (retryCount === this.maxRetryAttempts) {
              failedOrders.push(order);
              this.offlineQueue.shift();
              this.saveOfflineQueue();
            } else {
              await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
          }
        }
      }
      
      if (failedOrders.length > 0) {
        console.log(`⚠️ ${failedOrders.length} заказов не удалось синхронизировать`);
        this.notifyStatusChange('error');
      } else {
        console.log('✅ Все заказы успешно синхронизированы');
        this.notifyStatusChange('success');
      }
      
    } catch (error) {
      console.error('❌ Критическая ошибка при синхронизации после восстановления соединения:', error);
      this.notifyStatusChange('error');
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
      // Сначала проверяем существование заказов на сервере
      for (const order of orders) {
        if (!order || !order.id) {
          console.log('❌ Некорректные данные заказа:', order);
          continue;
        }

        try {
          await apiService.getOrderById(order.id);
          console.log(`✅ Заказ ${order.id} существует на сервере`);
        } catch (error) {
          if (error.status === 404) {
            console.log(`➕ Заказ ${order.id} не найден на сервере, создаем новый`);
            await apiService.createOrder(order);
          } else {
            throw error;
          }
        }
      }

      // Теперь синхронизируем все заказы
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
      this.notifyStatusChange('error');
      return false;
    }

    try {
      this.notifyStatusChange('syncing');
      
      console.log('🔄 Отправка на сервер...');
      const result = await this.syncWithBackend([order]);
      console.log('✅ СИНХРОНИЗАЦИЯ УСПЕШНА');
      console.log('📊 Результат:', result);
      
      this.notifyStatusChange('success');
      
      return result;
    } catch (error) {
      console.error('❌ ОШИБКА СИНХРОНИЗАЦИИ:', error);
      console.log('📱 Добавление в офлайн очередь...');
      this.offlineQueue.push(order);
      this.saveOfflineQueue();
      console.log('💾 Заказ добавлен в офлайн очередь');
      
      this.notifyStatusChange('error');
      
      return false;
    } finally {
      console.log('🟦 =====================================');
      console.log('🟦 КОНЕЦ СИНХРОНИЗАЦИИ ПРИ СОХРАНЕНИИ');
      console.log('🟦 =====================================');
    }
  }

  async syncOnDelete(orderId) {
    console.log('🟥 =====================================');
    console.log('🟥 НАЧАЛО СИНХРОНИЗАЦИИ ПРИ УДАЛЕНИИ');
    console.log('🟥 Заказ ID:', orderId);
    console.log('🟥 =====================================');
    
    if (!navigator.onLine) {
      console.log('❌ Нет подключения к интернету');
      this.notifyStatusChange('error');
      return false;
    }

    try {
      this.notifyStatusChange('syncing');
      
      console.log('🔄 Удаление заказа на сервере...');
      await apiService.deleteOrder(orderId);
      
      console.log('✅ ЗАКАЗ УСПЕШНО УДАЛЕН');
      this.notifyStatusChange('success');
      
      return true;
    } catch (error) {
      console.error('❌ ОШИБКА ПРИ УДАЛЕНИИ ЗАКАЗА:', error);
      this.notifyStatusChange('error');
      return false;
    } finally {
      console.log('🟥 =====================================');
      console.log('🟥 КОНЕЦ СИНХРОНИЗАЦИИ ПРИ УДАЛЕНИИ');
      console.log('🟥 =====================================');
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