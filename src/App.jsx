import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { syncService } from './services/syncService';
import { Toaster, toast } from 'react-hot-toast';

const App = () => {
  const [syncError, setSyncError] = useState(null);

  // Добавляем тестовое уведомление
  useEffect(() => {
    toast('Тестовое уведомление');
    toast.success('Тест успешного уведомления');
    toast.error('Тест ошибки');
    toast.warning('Тест предупреждения');
  }, []);

  useEffect(() => {
    const initializeSync = async () => {
      try {
        // Запускаем первичную синхронизацию
        const syncResult = await syncService.syncWithBackend();
        
        if (syncResult) {
          toast.success('Синхронизация выполнена успешно');
        } else if (!syncService.isOnline) {
          toast.warning('Приложение работает в оффлайн режиме');
        }
        
        // Запускаем автоматическую синхронизацию каждые 5 минут
        syncService.startAutoSync(5 * 60 * 1000);
      } catch (error) {
        console.error('Ошибка при инициализации синхронизации:', error);
        setSyncError(error);
        toast.error('Ошибка синхронизации с сервером');
      }
    };

    initializeSync();
    
    // Очищаем интервал при размонтировании компонента
    return () => {
      syncService.stopAutoSync();
    };
  }, []);

  // Обработчики изменения состояния сети
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Подключение восстановлено');
      syncService.syncWithBackend(); // Запускаем синхронизацию при восстановлении соединения
    };

    const handleOffline = () => {
      toast.warning('Нет подключения к интернету');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#333',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  maxWidth: '400px'
                },
                success: {
                  style: {
                    background: '#059669',
                  },
                },
                error: {
                  style: {
                    background: '#DC2626',
                  },
                  duration: 7000,
                },
                warning: {
                  style: {
                    background: '#D97706',
                  },
                  duration: 6000,
                },
              }}
            />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/order/new" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
              <Route path="/order/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App; 