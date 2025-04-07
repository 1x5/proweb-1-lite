import React from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  createRoutesFromElements, 
  Route, 
  Navigate
} from 'react-router-dom';
import HomePage from './pages/HomePage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ element }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return element;
};

// Компонент для настроек с функционалом выхода
const SettingsWithLogout = ({ onLogout }) => {
  return <SettingsPage onLogout={onLogout} />;
};

function App() {
  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    localStorage.setItem('isLoggedIn', 'false');
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/" element={<ProtectedRoute element={<HomePage />} />} />
        <Route path="/order/:id" element={<ProtectedRoute element={<OrderDetailsPage />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<SettingsWithLogout onLogout={handleLogout} />} />} />
      </Route>
    )
  );

  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App; 