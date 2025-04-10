import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, List, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getOrders, deleteOrder } from '../services/OrderService';
import BottomNavigation from '../components/BottomNavigation';
import RegularOrderCard from '../components/RegularOrderCard';
import CompactOrderCard from '../components/CompactOrderCard';

const HomePage = () => {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [swipedOrderId, setSwipedOrderId] = useState(null);
  const [compactMode, setCompactMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const statusDropdownRef = useRef(null);
  const navigate = useNavigate();
  
  // Статусы заказов
  const statuses = ['Все', 'Ожидает', 'В работе', 'Выполнен'];
  
  // Определяем, является ли устройство мобильным
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Закрытие выпадающего меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Загрузка заказов при монтировании компонента
  useEffect(() => {
    const { orders: loadedOrders } = getOrders();
    setOrders(loadedOrders);
    setFilteredOrders(loadedOrders);
    
    // Загружаем состояние компактного режима из localStorage
    const savedCompactMode = localStorage.getItem('compactMode');
    if (savedCompactMode !== null) {
      setCompactMode(savedCompactMode === 'true');
    }
  }, []);
  
  // Сохраняем состояние компактного режима в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('compactMode', compactMode.toString());
  }, [compactMode]);
  
  // Фильтрация заказов при изменении фильтра или поискового запроса
  useEffect(() => {
    let result = [...orders];
    
    // Фильтрация по статусу
    if (selectedFilter !== 'Все') {
      result = result.filter(order => order.status === selectedFilter);
    }
    
    // Фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.name.toLowerCase().includes(query) || 
        (order.customer && order.customer.toLowerCase().includes(query))
      );
    }
    
    setFilteredOrders(result);
  }, [orders, selectedFilter, searchQuery]);
  
  // Обработчик выбора статуса
  const handleFilterChange = (status) => {
    setSelectedFilter(status);
    setShowStatusDropdown(false);
  };
  
  // Обработчик перехода к деталям заказа
  const handleOrderClick = (orderId) => {
    console.log('HomePage handleOrderClick:', { orderId, type: typeof orderId });
    if (orderId) {
      const url = `/order/${orderId}`;
      console.log('Navigating to:', url);
      navigate(url);
    }
  };
  
  // Обработчик удаления заказа
  const handleDeleteOrder = (orderId) => {
    try {
      // Удаляем заказ
      deleteOrder(orderId);
      
      // Получаем обновленный список заказов
      const { orders: updatedOrders } = getOrders();
      
      // Обновляем состояния
      setOrders(updatedOrders);
      
      // Применяем текущие фильтры к обновленному списку
      let filteredResult = [...updatedOrders];
      if (selectedFilter !== 'Все') {
        filteredResult = filteredResult.filter(order => order.status === selectedFilter);
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredResult = filteredResult.filter(order => 
          order.name.toLowerCase().includes(query) || 
          (order.customer && order.customer.toLowerCase().includes(query))
        );
      }
      setFilteredOrders(filteredResult);
      
      // Сбрасываем состояния UI
      setSwipedOrderId(null);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };
  
  // Функция для получения цвета статуса
  const getStatusColor = (status) => {
    switch(status) {
      case 'Выполнен':
        return '#22c55e'; // Зеленый
      case 'В работе':
        return '#3b82f6'; // Синий
      case 'Ожидает':
        return '#f59e0b'; // Оранжевый
      default:
        return '#6b7280'; // Серый для "Все"
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Добавляем день недели
    const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const weekDay = weekDays[date.getDay()];
    
    return `${day}.${month}.${year}, ${weekDay}`;
  };
  
  return (
    <div className="flex flex-col h-screen bg-opacity-50" style={{ backgroundColor: theme.bg }}>
      {/* Верхняя панель */}
      <div className="flex-none p-3" style={{ backgroundColor: theme.bg }}>
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold" style={{ color: theme.textPrimary }}>Заказы</h1>
          
          <div className="flex items-center space-x-2">
            {/* Иконка статуса */}
            <div className="relative" ref={statusDropdownRef}>
              <button 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.card }}
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: getStatusColor(selectedFilter),
                    display: 'inline-block'
                  }}
                />
              </button>
              {showStatusDropdown && (
                <div 
                  className="absolute top-full right-0 mt-1 rounded-lg shadow-lg z-10"
                  style={{ backgroundColor: theme.card, minWidth: '120px' }}
                >
                  {statuses.map(status => (
                    <button
                      key={status}
                      className="block w-full text-left px-4 py-2 first:rounded-t-lg last:rounded-b-lg"
                      style={{ 
                        backgroundColor: status === selectedFilter ? (status === 'Все' ? theme.accent : getStatusColor(status)) : 'transparent',
                        color: status === selectedFilter ? '#ffffff' : theme.textPrimary,
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                      onClick={() => handleFilterChange(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Иконка поиска */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full"
              style={{ backgroundColor: theme.card }}
            >
              <Search size={20} style={{ color: theme.textSecondary }} />
            </button>

            {/* Переключатель темы */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full"
              style={{ backgroundColor: theme.card }}
            >
              {darkMode ? (
                <Sun size={20} style={{ color: theme.textSecondary }} />
              ) : (
                <Moon size={20} style={{ color: theme.textSecondary }} />
              )}
            </button>

            {/* Переключатель вида */}
            <button
              onClick={() => setCompactMode(!compactMode)}
              className="p-2 rounded-full"
              style={{ backgroundColor: theme.card }}
            >
              {compactMode ? (
                <LayoutGrid size={20} style={{ color: theme.textSecondary }} />
              ) : (
                <List size={20} style={{ color: theme.textSecondary }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Поле поиска */}
      {showSearch && (
        <div className="p-3 mb-2" style={{ backgroundColor: theme.bg }}>
          <div 
            className="flex items-center rounded-xl px-3 py-2"
            style={{ backgroundColor: theme.card }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 rounded-xl"
              style={{ 
                backgroundColor: theme.card,
                color: theme.textPrimary,
                border: 'none'
              }}
              placeholder="Поиск заказов..."
            />
          </div>
        </div>
      )}
      
      {/* Список заказов */}
      <div className={`flex-1 overflow-y-auto ${compactMode ? 'px-2 space-y-1' : 'px-3 space-y-1.5'} pb-5`}>
        {filteredOrders.map((order) => (
          <div key={order.id} className="relative overflow-hidden rounded-xl">
            {/* Карточка заказа */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {compactMode ? 
                <CompactOrderCard 
                  key={`compact-${order.id}`}
                  order={order} 
                  isMobile={isMobile} 
                  theme={theme} 
                  getStatusColor={getStatusColor}
                  onClick={handleOrderClick}
                  onDelete={{
                    swipedOrderId,
                    setSwipedOrderId,
                    handleDeleteOrder
                  }}
                /> : 
                <RegularOrderCard 
                  key={`regular-${order.id}`}
                  order={order} 
                  isMobile={isMobile} 
                  theme={theme} 
                  formatDate={formatDate} 
                  getStatusColor={getStatusColor}
                  onClick={handleOrderClick}
                  onDelete={{
                    swipedOrderId,
                    setSwipedOrderId,
                    handleDeleteOrder
                  }}
                />
              }
            </div>
            
            {/* Подтверждение удаления */}
            {showDeleteConfirm === order.id && (
              <div 
                key={`delete-confirm-${order.id}`}
                className="absolute inset-0 flex items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className="p-4 rounded-lg text-center"
                  style={{ backgroundColor: theme.card, maxWidth: '80%' }}
                >
                  <p style={{ 
                    color: theme.textPrimary, 
                    marginBottom: '12px',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}>
                    Удалить заказ "{order.name}"?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      className="flex-1 py-2 rounded"
                      style={{ 
                        backgroundColor: theme.red, 
                        color: '#ffffff',
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                      onClick={(e) => handleDeleteOrder(order.id)}
                    >
                      Удалить
                    </button>
                    <button
                      className="flex-1 py-2 rounded"
                      style={{ 
                        backgroundColor: theme.card, 
                        color: theme.textSecondary,
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(null);
                        setSwipedOrderId(null);
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {filteredOrders.length === 0 && (
          <div 
            className="flex flex-col items-center justify-center mt-10 p-4 rounded-lg"
            style={{ backgroundColor: theme.card }}
          >
            <p style={{ 
              color: theme.textSecondary, 
              marginBottom: '8px',
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}>
              Нет заказов с выбранным статусом
            </p>
            <button
              className="px-4 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.accent, 
                color: '#ffffff',
                fontSize: isMobile ? '0.85rem' : '1rem'
              }}
              onClick={() => setSelectedFilter('Все')}
            >
              Показать все заказы
            </button>
          </div>
        )}
      </div>
      
      <BottomNavigation activePage="home" />
    </div>
  );
};

export default HomePage; 