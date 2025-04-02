import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, Calendar, List, LayoutGrid, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const handleDeleteOrder = (orderId, e) => {
    e.stopPropagation(); // Предотвращаем переход к деталям заказа
    
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      deleteOrder(orderId);
      setOrders(getOrders());
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
  
  // Компонент для отображения заказа в обычном режиме
  const RegularOrderCard = ({ order, isMobile }) => (
    <div
      className="rounded-xl p-3 transition-transform duration-300"
      style={{ 
        backgroundColor: theme.card,
        transform: swipedOrderId === order.id ? 'translateX(-80px)' : 'translateX(0)'
      }}
      onClick={() => {
        if (swipedOrderId === order.id) {
          setSwipedOrderId(null);
        } else {
          handleOrderClick(order.id);
        }
      }}
    >
      <div className="flex justify-between items-start mb-1">
        <div>
          <h2 className="font-bold" style={{ 
            color: theme.textPrimary,
            fontSize: isMobile ? '1rem' : '1.125rem'
          }}>{order.name}</h2>
          <p style={{ 
            color: theme.textSecondary,
            fontSize: isMobile ? '0.8rem' : '0.875rem'
          }}>{order.customer}</p>
        </div>
        <span
          style={{ 
            color: '#ffffff', 
            backgroundColor: getStatusColor(order.status),
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: isMobile ? '0.75rem' : '0.85rem'
          }}
        >
          {order.status}
        </span>
      </div>
      
      <div className="h-px w-full my-2" style={{ backgroundColor: theme.cardBorder }}></div>
      
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <Calendar size={isMobile ? 14 : 16} color={theme.textSecondary} className="mr-1" />
          <span style={{ 
            color: theme.textSecondary, 
            fontSize: isMobile ? '0.8rem' : '0.9rem'
          }}>Сдача:</span>
        </div>
        <span style={{ 
          color: theme.textPrimary, 
          fontSize: isMobile ? '0.8rem' : '0.9rem'
        }}>{formatDate(order.endDate)}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span style={{ 
          color: theme.textSecondary, 
          fontSize: isMobile ? '0.8rem' : '0.9rem'
        }}>Стоимость:</span>
        <span style={{ 
          color: theme.textPrimary, 
          fontSize: isMobile ? '0.8rem' : '0.9rem'
        }}>{order.price}₽</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span style={{ 
          color: theme.textSecondary, 
          fontSize: isMobile ? '0.8rem' : '0.9rem'
        }}>Прибыль:</span>
        <div className="flex items-center">
          <span style={{ 
            color: theme.green, 
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            marginRight: '4px'
          }}>
            +{order.profit}₽
          </span>
          <span 
            style={{ 
              color: order.profitPercent < 50 ? theme.red : theme.green, 
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              padding: '1px 4px',
              borderRadius: '2px'
            }}
          >
            {order.profitPercent}%
          </span>
        </div>
      </div>
    </div>
  );
  
  // Компонент для отображения заказа в компактном режиме
  const CompactOrderCard = ({ order, isMobile }) => (
    <div
      className="rounded-xl p-2 transition-transform duration-300 mb-1"
      style={{ 
        backgroundColor: theme.card,
        transform: swipedOrderId === order.id ? 'translateX(-80px)' : 'translateX(0)'
      }}
      onClick={() => {
        if (swipedOrderId === order.id) {
          setSwipedOrderId(null);
        } else {
          handleOrderClick(order.id);
        }
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 mr-2 flex items-center min-w-0">
          {/* Цветовая полоса статуса */}
          <div 
            className="w-1 h-4 rounded-full mr-2 flex-shrink-0"
            style={{ 
              backgroundColor: getStatusColor(order.status)
            }}
          />
          <h2 className="font-bold truncate" style={{ 
            color: theme.textPrimary,
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>{order.name}</h2>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="flex items-center">
            <Calendar size={isMobile ? 12 : 14} color={theme.textSecondary} className="mr-1" />
            <span style={{ 
              color: theme.textPrimary, 
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              whiteSpace: 'nowrap'
            }}>{formatDate(order.endDate)}</span>
          </div>
          
          <div className="flex items-center">
            <span style={{ 
              color: theme.textPrimary, 
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              whiteSpace: 'nowrap'
            }}>{order.price}₽</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };
  
  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Верхняя панель */}
      <div className="p-3 flex justify-between items-center" style={{ backgroundColor: darkMode ? '#1a1a1a' : theme.bg }}>
        <div className="flex items-center">
          <h1 className="text-xl font-bold" style={{ color: theme.textPrimary }}>Мои заказы</h1>
        </div>
        
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
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.card }}
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search size={20} color={theme.textPrimary} />
          </button>

          {/* Иконка вида */}
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.card }}
            onClick={() => setCompactMode(!compactMode)}
          >
            {compactMode ? 
              <LayoutGrid size={20} color={theme.textPrimary} /> : 
              <List size={20} color={theme.textPrimary} />
            }
          </button>

          {/* Переключатель темы */}
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.card }}
            onClick={toggleDarkMode}
          >
            {darkMode ? 
              <Sun size={20} color={theme.textPrimary} /> : 
              <Moon size={20} color={theme.textPrimary} />
            }
          </button>
        </div>
      </div>

      {/* Поле поиска */}
      {showSearch && (
        <div className="px-3 mb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск заказов..."
              className="w-full p-2 pl-10 rounded"
              style={{ 
                backgroundColor: theme.card, 
                color: theme.textPrimary, 
                border: 'none'
              }}
            />
            <Search 
              size={16} 
              color={theme.textSecondary} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
            />
          </div>
        </div>
      )}
      
      {/* Список заказов */}
      <div className="flex-1 p-3 overflow-auto pb-20">
        {filteredOrders.map(order => (
          <div key={order.id} className="relative mb-3 overflow-hidden rounded-xl">
            {/* Кнопка удаления (видна при свайпе) */}
            <div 
              className="absolute right-0 top-0 bottom-0 flex items-center"
              style={{ 
                transform: swipedOrderId === order.id ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s ease',
                zIndex: 1
              }}
            >
              <button
                className="h-full px-4 flex items-center justify-center"
                style={{ backgroundColor: theme.red }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(order.id);
                }}
              >
                <Trash2 size={isMobile ? 18 : 20} color="#ffffff" />
              </button>
            </div>
            
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
                      onClick={(e) => handleDeleteOrder(order.id, e)}
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