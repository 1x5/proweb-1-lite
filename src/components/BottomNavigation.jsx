import React from 'react';
import { Settings, Plus, Package } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const BottomNavigation = ({ activePage }) => {
  const { darkMode, theme } = useTheme();
  const navigate = useNavigate();
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center"
      style={{ 
        backgroundColor: theme.bg,
        padding: '8px 0',
        zIndex: 1000
      }}
    >
      <Link 
        to="/" 
        className="flex flex-col items-center"
        style={{ 
          color: activePage === 'orders' ? '#6C5CE7' : '#666666',
          textDecoration: 'none'
        }}
      >
        <Package size={18} />
        <span className="text-[10px] mt-0.5">Все заказы</span>
      </Link>
      
      <button
        className="flex items-center justify-center rounded-full w-10 h-10 transition-transform hover:scale-105 active:scale-95"
        onClick={() => navigate('/order/new')}
        style={{ 
          backgroundColor: '#6C5CE7',
          color: '#FFFFFF',
          border: 'none',
          transform: 'translateY(-16px)',
          boxShadow: '0 4px 6px rgba(108, 92, 231, 0.2)'
        }}
      >
        <Plus size={20} />
      </button>

      <button
        className="flex flex-col items-center bg-transparent border-0"
        onClick={() => navigate('/settings')}
        style={{ 
          color: activePage === 'settings' ? '#6C5CE7' : '#666666'
        }}
      >
        <Settings size={18} />
        <span className="text-[10px] mt-0.5">Настройки</span>
      </button>
    </nav>
  );
};

export default BottomNavigation; 