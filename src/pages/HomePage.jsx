import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, List, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getOrders, deleteOrder } from '../services/OrderService';
import syncService from '../services/syncService';
import { toast } from 'react-hot-toast';
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
  const handleDeleteOrder = async (orderId) => {
    try {
      // Удаляем заказ локально
      await deleteOrder(orderId);
      
      // Синхронизируем с сервером
      const syncResult = await syncService.syncOnDelete(orderId);
      
      if (syncResult) {
        toast.success('Заказ успешно удален');
      } else if (!syncService.isOnline) {
        toast('Заказ удален локально и будет синхронизирован при восстановлении соединения');
      } else {
        toast.error('Ошибка при удалении заказа на сервере');
      }
      
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
      toast.error('Ошибка при удалении заказа');
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
                  {statuses.map((status, index) => (
                    <button
                      key={`status-${index}`}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      style={{ color: theme.textPrimary }}
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
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.card }}
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search size={20} style={{ color: theme.textPrimary }} />
            </button>
            
            {/* Иконка темы */}
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.card }}
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <Sun size={20} style={{ color: theme.textPrimary }} />
              ) : (
                <Moon size={20} style={{ color: theme.textPrimary }} />
              )}
            </button>
            
            {/* Иконка компактного режима */}
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.card }}
              onClick={() => setCompactMode(!compactMode)}
            >
              {compactMode ? (
                <List size={20} style={{ color: theme.textPrimary }} />
              ) : (
                <LayoutGrid size={20} style={{ color: theme.textPrimary }} />
              )}
            </button>
          </div>
        </div>
        
        {/* Поле поиска */}
        {showSearch && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Поиск..."
              className="w-full p-2 rounded-lg"
              style={{ backgroundColor: theme.card, color: theme.textPrimary }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>
      
      {/* Список заказов */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Нет заказов</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id}>
                {compactMode ? (
                  <CompactOrderCard
                    order={order}
                    theme={theme}
                    getStatusColor={getStatusColor}
                    onClick={handleOrderClick}
                    onDelete={{
                      swipedOrderId,
                      setSwipedOrderId,
                      handleDeleteOrder
                    }}
                  />
                ) : (
                  <RegularOrderCard
                    order={order}
                    theme={theme}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    onClick={handleOrderClick}
                    onDelete={{
                      swipedOrderId,
                      setSwipedOrderId,
                      handleDeleteOrder
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Нижняя навигация */}
      <BottomNavigation />
    </div>
  );
};

export default HomePage; 