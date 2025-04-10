import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronLeft, ChevronDown, Edit2, Plus, Trash2, 
  Clock, X, Camera, Sun, Moon, ExternalLink, Link, Save
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getOrderById, saveOrders, getOrders, deleteOrder } from '../services/OrderService';
import { useTheme } from '../contexts/ThemeContext';
import heic2any from 'heic2any';
import { syncService } from '../services/syncService';
import { toast } from 'react-hot-toast';

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

@keyframes slideDown {
  0% { transform: translateY(-100%); }
  15% { transform: translateY(0); }
  85% { transform: translateY(0); }
  100% { transform: translateY(-100%); }
}
`;

const progressAnimation = `
  @keyframes progress {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: -100% 0;
    }
  }
  @keyframes slideDown {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  @keyframes slideUp {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(-100%);
      opacity: 0;
    }
  }
`;

const OrderDetailsPage = () => {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [product, setProduct] = useState(null);
  const [showSuccessBar, setShowSuccessBar] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isNewOrder, setIsNewOrder] = useState(false);
  const [linkAnimations, setLinkAnimations] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
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
      // Создаем новый заказ с уникальным временным id
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const tempId = `temp-${timestamp}-${random}`;
      
      setIsNewOrder(true);
      setProduct({
        id: tempId,
        name: 'Новый заказ',
        customer: '',
        status: 'Ожидает',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 7,
        price: 1000, // Начальная цена
        cost: 0,
        profit: 0,
        profitPercent: 0,
        prepayment: 0,
        balance: 1000, // Начальный баланс равен цене
        phone: '',
        messenger: 'WhatsApp',
        expenses: [{
          id: Date.now().toString(),
          name: '',
          cost: 0,
          link: '',
          isNew: true
        }],
        photos: [],
        notes: '',
        version: 0
      });
      setEditMode(true);
      // Очищаем состояние фотографий при создании нового заказа
      setPhotos([]);
      setPreviewPhoto(null);
      setUploadProgress({});
    } else {
      // Загружаем существующий заказ
      setIsNewOrder(false);
      // Проверяем, что id существует и является числом
      const orderId = id ? parseInt(id) : null;
      console.log('Loading order:', { id, orderId });
      if (orderId && !isNaN(orderId)) {
        const orderData = getOrderById(orderId);
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
    }
  }, [id, navigate]);
  
  // Инициализация нового заказа
  useEffect(() => {
    if (isNewOrder) {
      const newOrder = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'Новый заказ',
        customer: '',
        status: 'Ожидает',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 7,
        price: 1000, // Начальная цена
        cost: 0,
        profit: 0,
        profitPercent: 0,
        prepayment: 0,
        balance: 1000, // Начальный баланс равен цене
        phone: '',
        messenger: 'WhatsApp',
        expenses: [{
          id: Date.now().toString(),
          name: '',
          cost: 0,
          link: '',
          isNew: true
        }],
        photos: [],
        notes: '',
        version: 0
      };
      setProduct(newOrder);
    }
  }, [isNewOrder]);
  
  // Оборачиваем handleSaveOrder в useCallback
  const handleSaveOrder = useCallback(async (redirectToHome = true) => {
    console.log('🔵 =====================================');
    console.log('🔵 НАЧАЛО СОХРАНЕНИЯ ЗАКАЗА');
    console.log('🔵 =====================================');
    console.log('📋 Данные заказа:', JSON.stringify(product, null, 2));
    
    try {
      setIsSaving(true);
      if (!product) {
        console.log('❌ Ошибка: product не определен');
        return;
      }
      
      // Валидация обязательных полей
      console.log('🔍 Проверка обязательных полей...');
      if (!product.name || product.name.trim() === '') {
        console.log('❌ Ошибка: название заказа не заполнено');
        toast.error('Введите название заказа');
        return;
      }
      
      // Проверка цены (разрешаем 0)
      if (product.price === undefined || product.price < 0) {
        console.log('❌ Ошибка: некорректная цена заказа');
        toast.error('Укажите корректную цену заказа');
        return;
      }

      // Валидация расходов (разрешаем пустой массив)
      console.log('🔍 Проверка расходов...');
      const invalidExpenses = product.expenses.filter(expense => 
        expense.name && expense.name.trim() !== '' && 
        (expense.cost === undefined || expense.cost < 0)
      );
      
      if (invalidExpenses.length > 0) {
        console.log('❌ Ошибка: некорректные расходы:', invalidExpenses);
        toast.error('Укажите корректную стоимость для заполненных расходов');
        return;
      }
      
      console.log('✅ Валидация пройдена успешно');
      
      // Пересчитываем прибыль и процент прибыли
      console.log('🧮 Пересчет финансовых показателей...');
      const totalCost = product.expenses.reduce((sum, expense) => sum + parseFloat(expense.cost || 0), 0);
      const price = parseFloat(product.price || 0);
      const profit = price - totalCost;
      const profitPercent = price > 0 ? Math.round((profit / price) * 100) : 0;
      
      // Рассчитываем остаток
      const prepayment = parseFloat(product.prepayment || 0);
      const balance = price - prepayment;
      
      console.log('📊 Финансовые показатели:', {
        totalCost,
        price,
        profit,
        profitPercent,
        prepayment,
        balance
      });
      
      const updatedProduct = {
        ...product,
        cost: totalCost,
        profit: profit,
        profitPercent: profitPercent,
        photos: photos,
        balance: balance,
        version: (parseInt(product.version || 0) + 1)
      };
      
      console.log('📝 Обновленные данные заказа:', JSON.stringify(updatedProduct, null, 2));
      
      // Получаем текущие заказы
      const { orders } = getOrders();
      
      let savedOrder;
      
      // Если это новый заказ, добавляем его в конец списка с новым числовым id
      if (isNewOrder) {
        console.log('🆕 Создание нового заказа...');
        // Находим максимальный числовой id среди существующих заказов
        const maxId = orders.reduce((max, order) => {
          const orderId = parseInt(order.id);
          return !isNaN(orderId) && orderId > max ? orderId : max;
        }, 0);
        
        // Создаем новый заказ с следующим числовым id
        const newOrder = {
          ...updatedProduct,
          id: (maxId + 1).toString()
        };
        
        console.log('📝 Новый ID заказа:', newOrder.id);
        
        // Сохраняем локально
        await saveOrders([...orders, newOrder]);
        setProduct(newOrder);
        savedOrder = newOrder;
      } else {
        console.log('📝 Обновление существующего заказа...');
        // Если существующий, обновляем его
        const updatedOrders = orders.filter(o => o.id !== product.id);
        await saveOrders([...updatedOrders, updatedProduct]);
        setProduct(updatedProduct);
        savedOrder = updatedProduct;
      }
      
      console.log('✅ Заказ сохранен локально');
      
      // Синхронизируем с сервером
      console.log('🔄 Начало синхронизации с сервером...');
      const syncResult = await syncService.syncOnSave(savedOrder);
      
      if (syncResult) {
        console.log('✅ Синхронизация успешна');
        toast.success('Заказ сохранен и синхронизирован');
      } else if (!syncService.isOnline) {
        console.log('⚠️ Офлайн режим - заказ будет синхронизирован позже');
        toast.warning('Заказ сохранен локально и будет синхронизирован при восстановлении соединения');
      } else {
        console.log('❌ Ошибка синхронизации');
        toast.error('Ошибка синхронизации с сервером');
      }
      
      setEditMode(false);
      setShowSuccessBar(true);
      
      // Если нужно перейти на главную страницу
      if (redirectToHome) {
        console.log('🏠 Перенаправление на главную страницу...');
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
      
      return savedOrder;
    } catch (error) {
      console.error('❌ Ошибка при сохранении:', error);
      toast.error('Ошибка при сохранении заказа');
    } finally {
      setIsSaving(false);
      console.log('🔵 =====================================');
      console.log('🔵 КОНЕЦ СОХРАНЕНИЯ ЗАКАЗА');
      console.log('🔵 =====================================');
    }
  }, [product, photos, isNewOrder, navigate]);
  
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
  
  // Функция для сжатия изображения
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Максимальные размеры
          const maxWidth = 800;
          const maxHeight = 800;

          let width = img.width;
          let height = img.height;

          // Изменяем размеры с сохранением пропорций
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Конвертируем в JPEG с качеством 0.7
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Обновляем обработчик загрузки файлов
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const fileId = Date.now() + '_' + file.name;
      
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));
      
      try {
        let imageFile = file;
        
        // Проверяем, является ли файл HEIC
        if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
          try {
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8
            });
            imageFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
              type: 'image/jpeg'
            });
          } catch (error) {
            console.error('Ошибка при конвертации HEIC:', error);
            alert('Ошибка при конвертации HEIC изображения');
            continue;
          }
        } else if (!file.type.startsWith('image/')) {
          alert('Пожалуйста, загружайте только изображения');
          continue;
        }
        
        // Сжимаем изображение
        const compressedDataUrl = await compressImage(imageFile);
        
        const newPhoto = {
          id: fileId,
          name: imageFile.name,
          type: 'image/jpeg',
          url: compressedDataUrl,
          date: new Date().toISOString()
        };
        
        setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
        
        // Имитируем загрузку
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: 100
        }));
        
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = {...prev};
            delete newProgress[fileId];
            return newProgress;
          });
        }, 1000);
        
      } catch (error) {
        console.error('Ошибка при обработке изображения:', error);
        alert('Ошибка при обработке изображения');
      }
    }
    
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
    setShowSuccessBar(false);
    
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
  
  // Функция для пересчета всех значений
  const recalculateValues = (updatedProduct) => {
    if (!updatedProduct) return null;
    
    const totalCost = updatedProduct.expenses.reduce((sum, expense) => sum + parseFloat(expense.cost || 0), 0);
    const price = parseFloat(updatedProduct.price || 0);
    const prepayment = parseFloat(updatedProduct.prepayment || 0);
    const profit = price - totalCost;
    const profitPercent = price > 0 ? Math.round((profit / price) * 100) : 0;
    const balance = price - prepayment;

    return {
      ...updatedProduct,
      cost: totalCost,
      profit: profit,
      profitPercent: profitPercent,
      balance: balance
    };
  };

  // Обработчик изменения цены
  const handlePriceChange = (e) => {
    if (!product) return;
    
    const newPrice = parseFloat(e.target.value) || 0;
    const updatedProduct = {
      ...product,
      price: newPrice
    };
    
    const recalculatedProduct = recalculateValues(updatedProduct);
    if (recalculatedProduct) {
      setProduct(recalculatedProduct);
    }
  };

  // Обработчик изменения предоплаты
  const handlePrepaymentChange = (e) => {
    if (!product) return;
    
    const newPrepayment = parseFloat(e.target.value) || 0;
    const updatedProduct = {
      ...product,
      prepayment: newPrepayment
    };
    
    const recalculatedProduct = recalculateValues(updatedProduct);
    if (recalculatedProduct) {
      setProduct(recalculatedProduct);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleExpenseChange = (expenseId, field, value) => {
    if (!product) return;
    
    const updatedExpenses = product.expenses.map(expense => {
      if (expense.id === expenseId) {
        return {
          ...expense,
          [field]: field === 'cost' ? parseFloat(value) || 0 : value
        };
      }
      return expense;
    });
    
    const updatedProduct = {
      ...product,
      expenses: updatedExpenses
    };
    
    const recalculatedProduct = recalculateValues(updatedProduct);
    if (recalculatedProduct) {
      setProduct(recalculatedProduct);
    }
  };

  // Обработчик добавления расхода
  const handleAddExpense = () => {
    if (!product) return;
    
    const newExpense = {
      id: Date.now().toString(),
      name: '',
      cost: 0,
      link: ''
    };
    
    const updatedProduct = {
      ...product,
      expenses: [...product.expenses, newExpense]
    };
    
    const recalculatedProduct = recalculateValues(updatedProduct);
    if (recalculatedProduct) {
      setProduct(recalculatedProduct);
    }
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
  
  // Обновляем функцию handlePasteLinkClick
  const handlePasteLinkClick = async (expenseId) => {
    try {
      // Пробуем напрямую прочитать из буфера обмена
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          updateExpenseLink(expenseId, text.trim());
          return;
        }
      }
      
      // Если не получилось, пробуем через execCommand
      const tempInput = document.createElement('input');
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = 0;
      tempInput.style.pointerEvents = 'none';
      document.body.appendChild(tempInput);
      
      tempInput.focus();
      const successful = document.execCommand('paste');
      
      if (successful) {
        const text = tempInput.value;
        if (text && text.trim()) {
          updateExpenseLink(expenseId, text.trim());
        }
      } else {
        // Если ничего не сработало, показываем prompt
        const text = window.prompt('Вставьте ссылку из буфера обмена:');
        if (text && text.trim()) {
          updateExpenseLink(expenseId, text.trim());
        }
      }
      
      document.body.removeChild(tempInput);
    } catch (err) {
      console.error('Ошибка при чтении буфера обмена:', err);
      // Если все методы не сработали, показываем prompt
      const text = window.prompt('Вставьте ссылку из буфера обмена:');
      if (text && text.trim()) {
        updateExpenseLink(expenseId, text.trim());
      }
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
    styleSheet.innerText = fadeInOutKeyframes + progressAnimation;
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
      <style>{progressAnimation}</style>
      <div className="relative" style={{ backgroundColor: theme.bg }}>
        {/* Полоса успешного сохранения */}
        {(showSuccessBar || isSaving) && (
          <div 
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ 
              backgroundColor: 'transparent',
              animation: showSuccessBar ? 
                'slideDown 0.3s ease-in-out forwards' : 
                (isSaving ? undefined : 'slideUp 0.15s ease-in-out forwards'),
              zIndex: 100
            }}
          >
            {isSaving && (
              <div 
                style={{
                  height: '100%',
                  width: '100%',
                  background: `linear-gradient(
                    90deg,
                    transparent 0%,
                    ${theme.green} 35%,
                    ${theme.green} 65%,
                    transparent 100%
                  )`,
                  backgroundSize: '200% 100%',
                  animation: 'progress 1s linear infinite',
                  opacity: 0.8
                }}
              />
            )}
          </div>
        )}
        
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
                <Save size={20} color="#ffffff" /> : 
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
                        onChange={handlePriceChange}
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
                                onChange={(e) => handleExpenseChange(expense.id, 'name', e.target.value)}
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
                                    handleExpenseChange(expense.id, 'link', text.trim());
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
                                onChange={(e) => handleExpenseChange(expense.id, 'cost', e.target.value)}
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
                      <div key={`progress-${fileId}`} className="mb-2">
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
                        key={`photo-${photo.id}`}
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