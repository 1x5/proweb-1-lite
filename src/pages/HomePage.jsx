import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, List, LayoutGrid, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { useTheme } from '../contexts/ThemeContext';
import { getOrders, deleteOrder } from '../services/OrderService';
import BottomNavigation from '../components/BottomNavigation';

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
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
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
    const loadedOrders = getOrders();
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
    let result = orders;
    
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
    navigate(`/order/${orderId}`);
  };
  
  // Обработчик удаления заказа
  const handleDeleteOrder = (orderId) => {
    try {
      // Удаляем заказ
      deleteOrder(orderId);
      
      // Получаем обновленный список заказов
      const updatedOrders = getOrders();
      
      // Обновляем состояния
      setOrders(updatedOrders);
      
      // Применяем текущие фильтры к обновленному списку
      let filteredResult = updatedOrders;
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
  
  // Обработчики свайпа
  const handleTouchStart = (e, orderId) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e, orderId) => {
    touchEndXRef.current = e.touches[0].clientX;
    
    const diff = touchStartXRef.current - touchEndXRef.current;
    
    // Если свайп влево больше 50px, показываем кнопку удаления
    if (diff > 50) {
      setSwipedOrderId(orderId);
    } else if (diff < -50) {
      // Если свайп вправо, скрываем кнопку удаления
      setSwipedOrderId(null);
    }
  };
  
  const handleTouchEnd = (e, orderId) => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    
    // Если свайп влево больше 150px, показываем подтверждение удаления
    if (diff > 150) {
      setShowDeleteConfirm(orderId);
    }
  };
  
  const SwipeableOrderCard = ({ order, children }) => {
    const swipeHandlers = useSwipeable({
      onSwipedLeft: () => setSwipedOrderId(order.id),
      onSwipedRight: () => setSwipedOrderId(null),
      trackMouse: true,
      preventDefaultTouchmoveEvent: true,
      delta: 10
    });

    const handleDelete = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      handleDeleteOrder(order.id);
    };

    return (
      <div className="relative overflow-hidden rounded-xl">
        <div
          {...swipeHandlers}
          className="relative z-10 transition-transform duration-200"
          style={{
            transform: swipedOrderId === order.id ? 'translateX(-80px)' : 'translateX(0)',
            backgroundColor: theme.card
          }}
          onClick={() => handleOrderClick(order.id)}
        >
          {children}
        </div>
        {swipedOrderId === order.id && (
          <button
            type="button"
            className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center z-0 cursor-pointer"
            style={{ backgroundColor: theme.red }}
            onClick={handleDelete}
          >
            <Trash2 size={16} color="#ffffff" />
          </button>
        )}
      </div>
    );
  };
  
  const RegularOrderCard = ({ order, isMobile }) => (
    <SwipeableOrderCard order={order}>
      <div className="p-2.5">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h2 className="font-bold" style={{ 
              color: theme.textPrimary,
              fontSize: '0.95rem'
            }}>{order.name}</h2>
          </div>
          <span
            style={{ 
              color: '#ffffff', 
              backgroundColor: getStatusColor(order.status),
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap'
            }}
          >
            {order.status}
          </span>
        </div>
        
        <div className="h-px w-full my-1.5" style={{ backgroundColor: theme.cardBorder }}></div>
        
        <div className="flex justify-between items-center mb-0.5">
          <span style={{ color: theme.textSecondary, fontSize: '0.8rem' }}>Дата:</span>
          <span style={{ color: theme.textPrimary, fontSize: '0.8rem' }}>{formatDate(order.startDate)}</span>
        </div>

        <div className="flex justify-between items-center mb-0.5">
          <span style={{ color: theme.textSecondary, fontSize: '0.8rem' }}>Стоимость:</span>
          <span style={{ color: theme.textPrimary, fontSize: '0.8rem' }}>{order.price?.toLocaleString()}₽</span>
        </div>

        <div className="flex justify-between items-center">
          <span style={{ color: theme.textSecondary, fontSize: '0.8rem' }}>Прибыль:</span>
          <div className="flex items-center gap-2">
            <span style={{ color: theme.green, fontSize: '0.8rem' }}>+{order.profit?.toLocaleString()}₽</span>
            <span style={{ 
              color: order.profitPercent < 50 ? theme.red : theme.green,
              fontSize: '0.75rem',
              backgroundColor: '#2D2D2D',
              padding: '1px 4px',
              borderRadius: '4px'
            }}>
              {order.profitPercent}%
            </span>
          </div>
        </div>
      </div>
    </SwipeableOrderCard>
  );
  
  const CompactOrderCard = ({ order, isMobile }) => {
    // Форматирование даты в формат дд.мм
    const formatShortDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}.${month}`;
    };

    return (
      <SwipeableOrderCard order={order}>
        <div className="py-1.5 px-3 rounded-xl" style={{ backgroundColor: theme.card }}>
          <div className="flex items-center w-full">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Цветовая полоса статуса */}
              <div 
                className="w-1 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: getStatusColor(order.status) }}
              />
              <h2 className="font-medium truncate" style={{ 
                color: theme.textPrimary,
                fontSize: '0.85rem'
              }}>{order.name}</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span style={{ 
                color: theme.textSecondary,
                fontSize: '0.75rem'
              }}>
                {formatShortDate(order.startDate)}
              </span>
              <span style={{ 
                color: theme.textPrimary,
                fontSize: '0.75rem'
              }}>
                {order.price?.toLocaleString()}₽
              </span>
              <span style={{ 
                color: order.profitPercent < 50 ? theme.red : theme.green,
                fontSize: '0.75rem'
              }}>
                {order.profitPercent}%
              </span>
            </div>
          </div>
        </div>
      </SwipeableOrderCard>
    );
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
        {filteredOrders.map(order => (
          <div key={order.id} className="relative overflow-hidden rounded-xl">
            {/* Карточка заказа */}
            <div
              onTouchStart={(e) => handleTouchStart(e, order.id)}
              onTouchMove={(e) => handleTouchMove(e, order.id)}
              onTouchEnd={(e) => handleTouchEnd(e, order.id)}
              style={{ position: 'relative', zIndex: 2 }}
            >
              {compactMode ? 
                <CompactOrderCard order={order} isMobile={isMobile} /> : 
                <RegularOrderCard order={order} isMobile={isMobile} />
              }
            </div>
            
            {/* Подтверждение удаления */}
            {showDeleteConfirm === order.id && (
              <div 
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