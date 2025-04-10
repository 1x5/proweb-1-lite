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

  async compressPhoto(photo) {
    if (!photo.url) return photo;
    
    // Создаем временный canvas для сжатия
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Максимальные размеры
        const maxWidth = 800;
        const maxHeight = 800;
        
        let width = img.width;
        let height = img.height;
        
        // Изменяем размеры с сохранением пропорций
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Конвертируем в JPEG с качеством 0.7
        const compressedUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        resolve({
          ...photo,
          url: compressedUrl
        });
      };
      img.src = photo.url;
    });
  }

  async syncOnSave(order) {
    try {
      // Проверяем подключение к интернету
      if (!navigator.onLine) {
        console.log('Нет подключения к интернету, добавляем в очередь');
        this.addToOfflineQueue(order);
        return { success: true, message: 'Добавлено в очередь для синхронизации' };
      }

      // Сжимаем фотографии перед отправкой
      const compressedPhotos = await Promise.all(
        (order.photos || []).map(photo => this.compressPhoto(photo))
      );
      
      const orderToSync = {
        ...order,
        photos: compressedPhotos
      };

      // Если это новый заказ (с временным ID)
      if (order.id.startsWith('temp-')) {
        // Удаляем временный ID перед отправкой на сервер
        const { id, ...orderWithoutId } = orderToSync;
        const result = await apiService.createOrder(orderWithoutId);
        return { success: true, data: result };
      }

      // Для существующего заказа
      const result = await apiService.updateOrder(orderToSync.id, orderToSync);
      return { success: true, data: result };

    } catch (error) {
      console.error('Ошибка при синхронизации:', error);
      this.addToOfflineQueue(order);
      return { 
        success: false, 
        message: 'Ошибка при синхронизации, добавлено в очередь'
      };
    }
  }

  async syncOnDelete(orderId) {
    console.log('🟥 =====================================');
    console.log('🟥 НАЧАЛО СИНХРОНИЗАЦИИ ПРИ УДАЛЕНИИ');
    console.log('🟥 Заказ ID:', orderId);
    console.log('🟥 =====================================');

    try {
      // Если ID начинается с temp-, значит заказ еще не был синхронизирован
      if (orderId.startsWith('temp-')) {
        console.log('✅ Заказ с временным ID успешно удален локально');
        return true;
      }

      console.log('🔄 Удаление заказа на сервере...');
      await apiService.deleteOrder(orderId);
      console.log('✅ Заказ успешно удален на сервере');
      return true;
    } catch (error) {
      console.log('❌ ОШИБКА ПРИ УДАЛЕНИИ ЗАКАЗА:', error);
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