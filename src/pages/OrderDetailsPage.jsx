import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronLeft, ChevronDown, Edit2, Check, Plus, Trash2, 
  Clock, X, Camera, Sun, Moon, ExternalLink, Link
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getOrderById, saveOrder, deleteOrder } from '../services/OrderService';
import { useTheme } from '../contexts/ThemeContext';

// Добавляем стили анимации
const fadeInOutKeyframes = `
@keyframes fadeInOut {
  0% { opacity: 0; transform: scale(0.8); }
  20% { opacity: 1; transform: scale(1.1); }
  30% { transform: scale(1); }
  90% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.8); }
}

@keyframes linkSuccess {
  0% { transform: scale(1); color: inherit; }
  50% { transform: scale(1.2); color: #22c55e; }
  100% { transform: scale(1); color: inherit; }
}
`;

const OrderDetailsPage = () => {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [product, setProduct] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isNewOrder, setIsNewOrder] = useState(false);
  const [linkAnimations, setLinkAnimations] = useState({});
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Статусы продукта
  const statuses = ['Ожидает', 'В работе', 'Выполнен'];
  
  // Доступные мессенджеры
  const messengers = ['WhatsApp', 'Telegram'];
  
  // Загрузка данных заказа по ID
  useEffect(() => {
    if (id === 'new') {
      // Создаем новый заказ
      setIsNewOrder(true);
      setProduct({
        name: 'Новый заказ',
        phone: '',
        messenger: 'WhatsApp', // По умолчанию выбираем WhatsApp
        cost: 0,
        price: 0,
        profit: 0,
        profitPercent: 0,
        status: 'Ожидает',
        duration: 7,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expenses: [{
          id: Date.now().toString(),
          name: '',
          cost: 0,
          link: '',
          isNew: true
        }],
        notes: '',
        photos: [],
        prepayment: 0,
        balance: 0
      });
      setEditMode(true);
    } else {
      // Загружаем существующий заказ
      setIsNewOrder(false);
      const orderData = getOrderById(id);
      if (orderData) {
        // Добавляем поля предоплаты и остатка, если их нет
        if (orderData.prepayment === undefined) {
          orderData.prepayment = 0;
        }
        if (orderData.balance === undefined) {
          orderData.balance = orderData.price || 0;
        }
        // Добавляем поля телефона и мессенджера, если их нет
        if (orderData.phone === undefined) {
          orderData.phone = '';
        }
        if (orderData.messenger === undefined) {
          orderData.messenger = 'WhatsApp';
        }
        setProduct(orderData);
        // Загружаем фотографии, если они есть
        if (orderData.photos && orderData.photos.length > 0) {
          setPhotos(orderData.photos);
        }
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);
  
  // Функция сохранения заказа
  const handleSaveOrder = useCallback((shouldNavigateHome = false) => {
    if (!product) return;
    
    // Пересчитываем прибыль и процент прибыли
    const totalCost = product.expenses.reduce((sum, expense) => sum + parseFloat(expense.cost || 0), 0);
    const price = parseFloat(product.price || 0);
    const profit = price - totalCost;
    const profitPercent = price > 0 ? Math.round((profit / price) * 100 * 10) / 10 : 0;
    
    // Рассчитываем остаток
    const prepayment = parseFloat(product.prepayment || 0);
    const balance = price - prepayment;
    
    const updatedProduct = {
      ...product,
      cost: totalCost,
      profit: profit,
      profitPercent: profitPercent,
      photos: photos,
      balance: balance
    };
    
    // Сохраняем изменения
    const savedOrder = saveOrder(updatedProduct);
    
    // Если это был новый заказ, обновляем URL
    if (isNewOrder) {
      setIsNewOrder(false);
      navigate(`/order/${savedOrder.id}`, { replace: true });
    }
    
    setProduct(savedOrder);
    setSaveMessage('Изменения сохранены');
    
    if (shouldNavigateHome) {
      // Если нужно перейти на главную страницу
      setTimeout(() => {
        navigate('/');
      }, 500); // Небольшая задержка, чтобы пользователь увидел сообщение о сохранении
    } else {
      // Просто скрываем сообщение через 1 секунду
      setTimeout(() => setSaveMessage(''), 1000);
    }
    
    return savedOrder;
  }, [product, navigate, photos, isNewOrder]);
  
  // Обработчик нажатия клавиш (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Проверяем, что нажата клавиша S вместе с Cmd (Mac) или Ctrl (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Предотвращаем стандартное поведение браузера (сохранение страницы)
        
        // Если мы в режиме редактирования, сохраняем изменения
        if (editMode) {
          handleSaveOrder(false); // Не переходим на главную страницу после сохранения
          setEditMode(false); // Выходим из режима редактирования
        }
      }
    };
    
    // Добавляем обработчик события
    window.addEventListener('keydown', handleKeyDown);
    
    // Удаляем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSaveOrder, editMode]);
  
  // Расчет длительности при изменении дат
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Разница в миллисекундах
    const diffTime = Math.abs(end - start);
    // Разница в днях
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Обработчик изменения даты начала
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    const newDuration = calculateDuration(newStartDate, product.endDate);
    
    setProduct({
      ...product, 
      startDate: newStartDate,
      duration: newDuration
    });
  };
  
  // Обработчик изменения даты окончания
  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    const newDuration = calculateDuration(product.startDate, newEndDate);
    
    setProduct({
      ...product, 
      endDate: newEndDate,
      duration: newDuration
    });
  };
  
  // Обработчик загрузки файлов
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Проверяем, что файл - изображение
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, загружайте только изображения');
        return;
      }
      
      const fileId = Date.now() + '_' + file.name;
      
      // Создаем объект для отслеживания прогресса загрузки
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));
      
      // Эмулируем процесс загрузки (в реальном приложении здесь был бы запрос к серверу)
      const simulateUpload = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 10) + 1;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Создаем URL для предпросмотра изображения
            const reader = new FileReader();
            reader.onload = (e) => {
              const newPhoto = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                url: e.target.result,
                date: new Date().toISOString()
              };
              
              setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
              
              // Удаляем прогресс загрузки через 1 секунду
              setTimeout(() => {
                setUploadProgress(prev => {
                  const newProgress = {...prev};
                  delete newProgress[fileId];
                  return newProgress;
                });
              }, 1000);
            };
            reader.readAsDataURL(file);
          } else {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: progress
            }));
          }
        }, 200);
      };
      
      simulateUpload();
    });
    
    // Очищаем input, чтобы можно было загрузить тот же файл повторно
    e.target.value = '';
  };
  
  // Удаление фотографии
  const handleDeletePhoto = (photoId) => {
    setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
    if (previewPhoto && previewPhoto.id === photoId) {
      setPreviewPhoto(null);
    }
  };
  
  // Открытие предпросмотра фотографии
  const handleOpenPreview = (photo) => {
    setPreviewPhoto(photo);
  };
  
  const toggleEditMode = () => {
    if (editMode) {
      // Сохраняем изменения при выходе из режима редактирования
      handleSaveOrder(false); // Передаем false, чтобы остаться на текущей странице
    }
    setEditMode(!editMode);
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
  
  const handleRemoveExpense = (expenseId) => {
    const updatedExpenses = product.expenses.filter(expense => expense.id !== expenseId);
    setProduct({...product, expenses: updatedExpenses});
  };
  
  // Функция удаления заказа
  const handleDeleteOrder = () => {
    if (!product) return;
    
    deleteOrder(product.id);
    setSaveMessage('Заказ удален');
    
    // Перенаправляем на главную страницу
    setTimeout(() => {
      navigate('/');
    }, 500);
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
        return '#6b7280'; // Серый
    }
  };
  
  // Обработчик изменения предоплаты
  const handlePrepaymentChange = (e) => {
    const prepayment = parseFloat(e.target.value) || 0;
    const price = parseFloat(product.price || 0);
    const balance = price - prepayment;
    
    setProduct({
      ...product,
      prepayment: prepayment,
      balance: balance
    });
  };
  
  // Функция для открытия чата в мессенджере
  const openMessenger = () => {
    if (!product.phone) return;
    
    // Форматируем номер телефона (удаляем все, кроме цифр)
    const formattedPhone = product.phone.replace(/\D/g, '');
    
    if (product.messenger === 'WhatsApp') {
      // Открываем WhatsApp
      window.open(`https://wa.me/${formattedPhone}`, '_blank');
    } else if (product.messenger === 'Telegram') {
      // Открываем Telegram
      window.open(`https://t.me/+${formattedPhone}`, '_blank');
    }
  };
  
  const handleAddExpense = () => {
    const newExpense = {
      id: Date.now().toString(),
      name: '',
      cost: 0,
      link: '',
      isNew: true
    };
    setProduct({
      ...product,
      expenses: [...product.expenses, newExpense]
    });
  };
  
  // Обновляем функцию handlePasteLinkClick
  const handlePasteLinkClick = async (expenseId) => {
    try {
      // Проверяем, поддерживается ли новый API
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
          const textBlob = await clipboardItem.getType('text/plain');
          const text = await new Response(textBlob).text();
          if (text && text.trim()) {
            updateExpenseLink(expenseId, text.trim());
          }
        }
      } 
      // Пробуем использовать старый API для iOS
      else if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          updateExpenseLink(expenseId, text.trim());
        }
      }
      // Для iOS используем execCommand
      else {
        const textArea = document.createElement('textarea');
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        
        const successful = document.execCommand('paste');
        const text = textArea.value;
        document.body.removeChild(textArea);
        
        if (successful && text && text.trim()) {
          updateExpenseLink(expenseId, text.trim());
        }
      }
    } catch (err) {
      console.error('Ошибка при чтении буфера обмена:', err);
    }
  };
  
  // Вспомогательная функция для обновления ссылки
  const updateExpenseLink = (expenseId, link) => {
    const updatedExpenses = product.expenses.map(expense =>
      expense.id === expenseId ? { ...expense, link } : expense
    );
    setProduct({ ...product, expenses: updatedExpenses });
    
    // Запускаем анимацию для конкретной иконки
    setLinkAnimations({ ...linkAnimations, [expenseId]: true });
    setTimeout(() => {
      setLinkAnimations({ ...linkAnimations, [expenseId]: false });
    }, 1000);
  };
  
  // Добавляем стили в head
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = fadeInOutKeyframes;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  
  // Если данные еще не загружены
  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: theme.bg }}>
        <div style={{ color: theme.textPrimary }}>Загрузка...</div>
      </div>
    );
  }
  
  return (
    <>
      <style>{fadeInOutKeyframes}</style>
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: theme.bg }}>
        {/* Верхняя панель */}
        <div className="flex-none p-3 flex justify-between items-center" style={{ backgroundColor: theme.bg }}>
          <div className="flex items-center">
            <ChevronLeft 
              size={24} 
              color={theme.textPrimary} 
              className="mr-2 cursor-pointer" 
              onClick={() => navigate('/')}
            />
            <h1 className="text-sm font-bold" style={{ color: theme.textPrimary }}>
              {editMode ? 'Редактирование' : 'Просмотр'}
            </h1>
          </div>
          
          <div className="flex items-center">
            {saveMessage && (
              <div className="mr-2 flex items-center justify-center rounded-full p-2 animate-fade-in" style={{ 
                backgroundColor: theme.green,
                animation: 'fadeInOut 1s ease-in-out'
              }}>
                <Check size={20} color="#ffffff" />
              </div>
            )}
            <button 
              className="rounded-full p-2 mr-2"
              style={{ backgroundColor: theme.card }}
              onClick={toggleDarkMode}
            >
              {darkMode ? 
                <Sun size={20} color={theme.textPrimary} /> : 
                <Moon size={20} color={theme.textPrimary} />
              }
            </button>

            {id !== 'new' && !isNewOrder && (
              <button 
                className="rounded-full p-2 mr-2"
                style={{ backgroundColor: theme.red }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={20} color="#ffffff" />
              </button>
            )}
            
            <button 
              className="rounded-full p-2"
              style={{ backgroundColor: editMode ? theme.green : theme.accent }}
              onClick={toggleEditMode}
            >
              {editMode ? 
                <Check size={20} color="#ffffff" /> : 
                <Edit2 size={20} color="#ffffff" />
              }
            </button>
          </div>
        </div>
        
        {/* Основной контент */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 pb-20">
            <div className="space-y-2 mt-[0.7rem]">
              {/* Основная информация */}
              <div 
                className="rounded-xl px-[0.7rem] py-1.5 mb-2"
                style={{ backgroundColor: theme.card }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <h2 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Информация</h2>
                  {/* Статус заказа */}
                  {product && (
                    <div className="relative">
                      {editMode ? (
                        <div className="relative">
                          <select
                            value={product.status}
                            onChange={(e) => setProduct({...product, status: e.target.value})}
                            className="appearance-none px-2 py-0.5 pr-6 rounded text-sm"
                            style={{ 
                              backgroundColor: getStatusColor(product.status),
                              color: '#ffffff',
                              border: 'none'
                            }}
                          >
                            {statuses.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                          <ChevronDown 
                            size={14} 
                            color="#ffffff" 
                            className="absolute right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none" 
                          />
                        </div>
                      ) : (
                        <span
                          className="text-sm"
                          style={{ 
                            color: '#ffffff', 
                            backgroundColor: getStatusColor(product.status),
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          {product.status}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="h-px w-full mb-1.5" style={{ backgroundColor: theme.cardBorder }}></div>
                
                {/* Название заказа */}
                <div className="mb-1.5">
                  <div className="text-sm mb-0.5" style={{ color: theme.textSecondary }}>Название:</div>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={product?.name || ''}
                      onChange={(e) => setProduct({...product, name: e.target.value})}
                      className="w-full p-1.5 rounded text-sm"
                      style={{ backgroundColor: theme.inputBg, color: theme.textPrimary, border: 'none' }}
                      placeholder="Введите название заказа"
                    />
                  ) : (
                    <div 
                      className="text-sm"
                      style={{ color: theme.textPrimary, cursor: product.phone ? 'pointer' : 'default' }}
                      onClick={() => product.phone && openMessenger()}
                    >
                      {product?.name || 'Не указано'}
                    </div>
                  )}
                </div>
                
                {/* Контактная информация в две колонки */}
                {editMode && (
                  <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                    {/* Поле телефона */}
                    <div>
                      <div className="text-sm mb-0.5" style={{ color: theme.textSecondary }}>Телефон:</div>
                      <input 
                        type="tel" 
                        value={product.phone}
                        onChange={(e) => setProduct({...product, phone: e.target.value})}
                        className="w-full p-1.5 rounded text-sm"
                        style={{ backgroundColor: theme.inputBg, color: theme.textPrimary, border: 'none' }}
                        placeholder="+7 (___) ___-__-__"
                      />
                    </div>
                    
                    {/* Поле мессенджера */}
                    <div>
                      <div className="text-sm mb-0.5" style={{ color: theme.textSecondary }}>Мессенджер:</div>
                      <select
                        value={product.messenger}
                        onChange={(e) => setProduct({...product, messenger: e.target.value})}
                        className="w-full p-1.5 rounded text-sm"
                        style={{ backgroundColor: theme.inputBg, color: theme.textPrimary, border: 'none' }}
                      >
                        {messengers.map(messenger => (
                          <option key={messenger} value={messenger}>{messenger}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Финансовая информация в две колонки */}
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Поле цены */}
                  <div className="mb-1">
                    <div className="text-sm mb-0.5" style={{ color: theme.textSecondary }}>Стоимость:</div>
                    {editMode ? (
                      <input 
                        type="number" 
                        value={product.price || ''}
                        onChange={(e) => setProduct({...product, price: parseFloat(e.target.value) || 0})}
                        className="w-full p-1.5 rounded text-sm"
                        style={{ backgroundColor: theme.inputBg, color: theme.textPrimary, border: 'none' }}
                        placeholder="0"
                      />
                    ) : (
                      <div className="text-sm" style={{ color: theme.textPrimary }}>
                        {product.price.toLocaleString()} ₽
                      </div>
                    )}
                  </div>
                  
                  {/* Поле предоплаты */}
                  <div className="mb-1">
                    <div className="text-sm mb-0.5" style={{ color: theme.textSecondary }}>Предоплата:</div>
                    {editMode ? (
                      <input 
                        type="number" 
                        value={product.prepayment || ''}
                        onChange={handlePrepaymentChange}
                        className="w-full p-1.5 rounded text-sm"
                        style={{ backgroundColor: theme.inputBg, color: theme.textPrimary, border: 'none' }}
                        placeholder="0"
                      />
                    ) : (
                      <div className="text-sm" style={{ color: theme.textPrimary }}>
                        {product.prepayment.toLocaleString()} ₽
                      </div>
                    )}
                  </div>
                  
                  {/* Поле себестоимости */}
                  <div className="mb-1">
                    <div className="text-sm mb-0.5" style={{ color: theme.textSecondary }}>Себестоимость:</div>
                    <div className="text-sm" style={{ color: theme.textPrimary }}>
                      {product.cost.toLocaleString()} ₽
                    </div>
                  </div>
                  
                  {/* Поле остатка */}
                  <div className="mb-1">
                    <div className="text-sm mb-0.5" style={{ color: theme.textSecondary }}>Остаток:</div>
                    <div className="text-sm" style={{ 
                      color: product.balance > 0 ? theme.red : theme.green,
                      fontWeight: 'bold'
                    }}>
                      {product.balance.toLocaleString()} ₽
                    </div>
                  </div>
                  
                  {/* Поле прибыли */}
                  <div className="mb-1">
                    <div className="text-sm mb-0.5" style={{ color: theme.textSecondary }}>Прибыль:</div>
                    <div className="text-sm" style={{ 
                      color: product.profit >= 0 ? theme.green : theme.red,
                      fontWeight: 'bold'
                    }}>
                      {product.profit.toLocaleString()} ₽
                    </div>
                  </div>
                  
                  {/* Поле процента прибыли */}
                  <div className="mb-1">
                    <div className="text-sm mb-0.5" style={{ color: theme.textSecondary }}>Процент:</div>
                    <div className="text-sm" style={{ 
                      color: product.profitPercent >= 0 ? theme.green : theme.red,
                      fontWeight: 'bold'
                    }}>
                      {product.profitPercent}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Блок расходов */}
              <div className="mb-2 rounded-xl px-[0.7rem] py-2" style={{ backgroundColor: theme.card }}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Расходы: {product.cost}₽</h2>
                  {editMode && (
                    <button 
                      className="rounded-full w-6 h-6 flex items-center justify-center"
                      style={{ backgroundColor: theme.accent }}
                      onClick={handleAddExpense}
                    >
                      <Plus size={16} color="#ffffff" />
                    </button>
                  )}
                </div>

                <div className="h-px w-full mb-3" style={{ backgroundColor: theme.cardBorder }}></div>
                
                <div className="rounded-lg max-h-[300px] overflow-y-auto">
                  {/* Список расходов */}
                  {product.expenses.map((expense) => (
                    <div 
                      key={expense.id} 
                      className="mb-2 last:mb-0"
                    >
                      <div className="flex justify-between items-end">
                        <div className="flex items-center">
                          {editMode ? (
                            <div className="flex items-center">
                              <input 
                                type="text" 
                                value={expense.name}
                                onChange={(e) => {
                                  const updatedExpenses = [...product.expenses];
                                  const index = updatedExpenses.findIndex(exp => exp.id === expense.id);
                                  if (index !== -1) {
                                    updatedExpenses[index].name = e.target.value;
                                    setProduct({...product, expenses: updatedExpenses});
                                  }
                                }}
                                className="p-1 rounded"
                                style={{ 
                                  backgroundColor: theme.inputBg,
                                  color: theme.textPrimary,
                                  border: 'none',
                                  fontSize: '0.875rem',
                                  width: '150px'
                                }}
                                placeholder="Название"
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    const text = await navigator.clipboard.readText();
                                    const updatedExpenses = [...product.expenses];
                                    const index = updatedExpenses.findIndex(exp => exp.id === expense.id);
                                    if (index !== -1) {
                                      updatedExpenses[index].link = text;
                                      setProduct({...product, expenses: updatedExpenses});
                                    }
                                  } catch (err) {
                                    console.error('Failed to read clipboard:', err);
                                  }
                                }}
                                className="p-1.5 rounded-full ml-2 flex items-center justify-center"
                                style={{ 
                                  backgroundColor: theme.inputBg,
                                  color: expense.link ? theme.accent : theme.textSecondary
                                }}
                                title={expense.link || 'Вставить ссылку из буфера'}
                              >
                                <Link
                                  size={16}
                                  className="cursor-pointer"
                                  style={{ 
                                    color: expense.link ? theme.accent : theme.textSecondary,
                                    animation: linkAnimations[expense.id] ? 'linkSuccess 1s ease' : 'none'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePasteLinkClick(expense.id);
                                  }}
                                />
                              </button>
                            </div>
                          ) : (
                            expense.name && (
                              <div className="flex items-center">
                                {expense.link ? (
                                  <a
                                    href={expense.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center hover:opacity-80"
                                    style={{ color: theme.textPrimary }}
                                  >
                                    <span style={{ fontSize: '0.875rem' }}>{expense.name}</span>
                                    <ExternalLink size={14} style={{ color: theme.textSecondary, marginLeft: '8px' }} />
                                  </a>
                                ) : (
                                  <span style={{ color: theme.textPrimary, fontSize: '0.875rem' }}>{expense.name}</span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                        <div className="flex items-center">
                          {editMode ? (
                            <>
                              <input 
                                type="number" 
                                value={expense.cost || ''}
                                onChange={(e) => {
                                  const updatedExpenses = [...product.expenses];
                                  const index = updatedExpenses.findIndex(exp => exp.id === expense.id);
                                  if (index !== -1) {
                                    updatedExpenses[index].cost = parseFloat(e.target.value) || 0;
                                    setProduct({...product, expenses: updatedExpenses});
                                  }
                                }}
                                className="p-1 rounded w-20 text-right mr-2"
                                style={{ 
                                  backgroundColor: theme.inputBg,
                                  color: theme.textPrimary,
                                  border: 'none',
                                  fontSize: '0.875rem'
                                }}
                                placeholder="0"
                              />
                              <button 
                                onClick={() => handleRemoveExpense(expense.id)}
                                className="p-1 rounded-full"
                                style={{ backgroundColor: 'rgba(255,0,0,0.1)' }}
                              >
                                <Trash2 size={14} color={theme.red} />
                              </button>
                            </>
                          ) : (
                            <span style={{ color: theme.textPrimary, fontSize: '0.875rem', backgroundColor: theme.card, paddingLeft: '4px' }}>{expense.cost}₽</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Блок заметок */}
              {(editMode || product.notes) && (
                <div className="mb-2 rounded-xl px-[0.7rem] py-2" style={{ backgroundColor: theme.card }}>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Заметки</h2>
                  </div>
                  
                  <div className="h-px w-full mb-3" style={{ backgroundColor: theme.cardBorder }}></div>
                  
                  {editMode ? (
                    <textarea 
                      value={product.notes || ''}
                      onChange={(e) => setProduct({...product, notes: e.target.value})}
                      className="w-full rounded text-sm p-2"
                      style={{ 
                        color: theme.textPrimary, 
                        border: 'none',
                        resize: 'vertical',
                        backgroundColor: theme.inputBg,
                        minHeight: '100px',
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}
                      placeholder="Добавьте заметки к заказу..."
                    />
                  ) : (
                    <div 
                      className="rounded max-h-[300px] overflow-y-auto"
                    >
                      <p className="text-sm" style={{ color: theme.textPrimary }}>{product.notes}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Блок сроков */}
              <div className="mb-2 rounded-xl px-[0.7rem] py-2" style={{ backgroundColor: theme.card }}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Даты</h2>
                  <div className="flex items-center">
                    <Clock size={16} color={theme.textSecondary} className="mr-1" />
                    <span style={{ color: theme.textPrimary }}>{product.duration}</span>
                    <span style={{ color: theme.textSecondary, marginLeft: '4px' }}>дней</span>
                  </div>
                </div>
                
                <div className="h-px w-full mb-3" style={{ backgroundColor: theme.cardBorder }}></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm mb-1" style={{ color: theme.textSecondary }}>Начало:</div>
                    {editMode ? (
                      <input 
                        type="date" 
                        value={product.startDate}
                        onChange={handleStartDateChange}
                        className="w-full p-1.5 rounded text-sm"
                        style={{ backgroundColor: theme.inputBg, color: theme.textPrimary, border: 'none' }}
                      />
                    ) : (
                      <div className="text-sm" style={{ color: theme.textPrimary }}>{formatDate(product.startDate)}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm mb-1" style={{ color: theme.textSecondary }}>Окончание:</div>
                    {editMode ? (
                      <input 
                        type="date" 
                        value={product.endDate}
                        onChange={handleEndDateChange}
                        className="w-full p-1.5 rounded text-sm"
                        style={{ backgroundColor: theme.inputBg, color: theme.textPrimary, border: 'none' }}
                      />
                    ) : (
                      <div className="text-sm" style={{ color: theme.textPrimary }}>{formatDate(product.endDate)}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Блок фотографий */}
              <div className="mb-2 rounded-xl px-[0.7rem] py-2" style={{ backgroundColor: theme.card }}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Фотографии</h2>
                </div>
                
                <div className="h-px w-full mb-3" style={{ backgroundColor: theme.cardBorder }}></div>
                
                {/* Загрузка фотографий */}
                {editMode && (
                  <div className="mb-3">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button 
                      className="w-full p-3 rounded flex items-center justify-center"
                      style={{ 
                        backgroundColor: theme.innerCard, 
                        color: theme.textPrimary,
                        border: `1px dashed ${theme.cardBorder}`
                      }}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <Camera size={20} className="mr-2" />
                      Загрузить фотографии
                    </button>
                  </div>
                )}
                
                {/* Индикаторы прогресса загрузки */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="mb-3">
                    {Object.entries(uploadProgress).map(([fileId, progress]) => (
                      <div key={fileId} className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
                            Загрузка: {fileId.split('_')[1]}
                          </span>
                          <span style={{ color: theme.textPrimary, fontSize: '0.875rem' }}>
                            {progress}%
                          </span>
                        </div>
                        <div 
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: theme.inputBg }}
                        >
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${progress}%`, 
                              backgroundColor: theme.accent,
                              transition: 'width 0.2s ease-in-out'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Галерея фотографий */}
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map(photo => (
                      <div 
                        key={photo.id} 
                        className="relative aspect-square rounded overflow-hidden"
                        onClick={() => handleOpenPreview(photo)}
                      >
                        <img 
                          src={photo.url} 
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                        {editMode && (
                          <button 
                            className="absolute top-1 right-1 rounded-full p-1"
                            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(photo.id);
                            }}
                          >
                            <X size={16} color="#ffffff" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4" style={{ color: theme.textSecondary }}>
                    Нет фотографий
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Модальное окно предпросмотра фотографии */}
        {previewPhoto && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          >
            <div className="relative max-w-full max-h-full p-2">
              <img 
                src={previewPhoto.url} 
                alt={previewPhoto.name}
                className="max-w-full max-h-[90vh] object-contain"
              />
              <button 
                className="absolute top-2 right-2 rounded-full p-2"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={() => setPreviewPhoto(null)}
              >
                <X size={24} color="#ffffff" />
              </button>
            </div>
          </div>
        )}
        
        {/* Модальное окно подтверждения удаления */}
        {showDeleteConfirm && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <div 
              className="p-4 rounded-lg text-center"
              style={{ backgroundColor: theme.card, maxWidth: '80%', width: '300px' }}
            >
              <h3 
                className="text-lg font-bold mb-3" 
                style={{ color: theme.textPrimary }}
              >
                Удалить заказ?
              </h3>
              <p 
                className="mb-4" 
                style={{ color: theme.textSecondary }}
              >
                Вы уверены, что хотите удалить заказ "{product?.name}"? Это действие нельзя отменить.
              </p>
              <div className="flex space-x-2">
                <button
                  className="flex-1 py-2 rounded"
                  style={{ backgroundColor: theme.card, color: theme.textSecondary }}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Отмена
                </button>
                <button
                  className="flex-1 py-2 rounded"
                  style={{ backgroundColor: theme.red, color: '#ffffff' }}
                  onClick={handleDeleteOrder}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}
        
        <BottomNavigation />
      </div>
    </>
  );
};

export default OrderDetailsPage; 