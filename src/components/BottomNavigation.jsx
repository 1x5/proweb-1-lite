import React from 'react';
import { Home, Settings, Plus, Package } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const BottomNavigation = ({ activePage }) => {
  const { darkMode, theme } = useTheme();
  const navigate = useNavigate();
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center"
      style={{ 
        backgroundColor: darkMode ? '#1a1a1a' : theme.bg,
        borderTop: `1px solid ${theme.cardBorder}`,
        padding: '8px 0'
      }}
    >
      <button
        className="flex flex-col items-center"
        onClick={() => navigate('/')}
        style={{ color: activePage === 'home' ? theme.accent : theme.textSecondary }}
      >
        <Home size={20} />
        <span className="text-xs mt-1">Главная</span>
      </button>
      
      <button
        className="flex flex-col items-center"
        onClick={() => navigate('/order/new')}
        style={{ color: activePage === 'new' ? theme.accent : theme.textSecondary }}
      >
        <Plus size={20} />
        <span className="text-xs mt-1">Новый</span>
      </button>
      
      <button
        className="flex flex-col items-center"
        onClick={() => navigate('/settings')}
        style={{ color: activePage === 'settings' ? theme.accent : theme.textSecondary }}
      >
        <Settings size={20} />
        <span className="text-xs mt-1">Настройки</span>
      </button>
      
      <Link 
        to="/" 
        className="flex flex-col items-center"
        style={{ color: activePage === 'orders' ? theme.accent : theme.textSecondary }}
      >
        <Package size={24} />
        <span className="text-xs mt-1">Заказы</span>
      </Link>
    </nav>
  );
};

export default BottomNavigation; 