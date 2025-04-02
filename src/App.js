import React, { useState, useEffect } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  createRoutesFromElements, 
  Route, 
  Navigate,
  useNavigate,
  useLocation
} from 'react-router-dom';
import HomePage from './pages/HomePage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { ThemeProvider } from './contexts/ThemeContext';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ element }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return element;
};

// Компонент для глобальных горячих клавиш
const GlobalHotkeys = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Проверяем, что не находимся в поле ввода
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      
      // Cmd+N или Ctrl+N - создать новый заказ
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !isInputActive) {
        e.preventDefault();
        navigate('/order/new');
      }
      
      // Cmd+, или Ctrl+, - открыть настройки
      if ((e.metaKey || e.ctrlKey) && e.key === ',' && !isInputActive) {
        e.preventDefault();
        navigate('/settings');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);
  
  return null;
};

// Компонент-обертка для передачи функции logout
const SettingsWithLogout = ({ onLogout }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };
  
  return <SettingsPage onLogout={handleLogout} />;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('isLoggedIn') === 'true'
  );
  
  // Принудительно очищаем localStorage при первой загрузке приложения
  useEffect(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  }, []);
  
  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };
  
  // Создаем маршруты с использованием нового API React Router v6.4+
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/" element={
          <>
            <GlobalHotkeys />
            <ProtectedRoute element={<HomePage onLogout={handleLogout} />} />
          </>
        } />
        <Route path="/order/:id" element={
          <>
            <GlobalHotkeys />
            <ProtectedRoute element={<OrderDetailsPage />} />
          </>
        } />
        <Route path="/settings" element={
          <>
            <GlobalHotkeys />
            <ProtectedRoute element={<SettingsWithLogout onLogout={handleLogout} />} />
          </>
        } />
      </>
    )
  );

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App; 