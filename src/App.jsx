import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { syncService } from './services/syncService';

const App = () => {
  useEffect(() => {
    // Запускаем первичную синхронизацию
    syncService.syncWithBackend();
    
    // Запускаем автоматическую синхронизацию каждые 5 минут
    syncService.startAutoSync();
    
    // Очищаем интервал при размонтировании компонента
    return () => {
      clearInterval(syncService.syncInterval);
    };
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/order/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
              <Route path="/order/new" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App; 