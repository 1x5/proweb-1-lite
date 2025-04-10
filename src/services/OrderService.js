// Сервис для работы с заказами
const STORE_NAME = 'orders';

// Начальные данные для демонстрации
const initialOrders = [
  {
    id: 1,
    name: 'Стол обеденный',
    customer: 'Иванов А.П.',
    status: 'Выполнен',
    endDate: '2025-04-08',
    startDate: '2025-04-01',
    duration: 7,
    price: 13000,
    cost: 5700,
    profit: 7300,
    profitPercent: 56,
    expenses: [
      {
        id: 1,
        name: 'Материалы',
        cost: 4500,
        link: 'https://example.com/materials'
      },
      {
        id: 2,
        name: 'Транспорт',
        cost: 1200
      }
    ],
    notes: 'Клиент просил светлое дерево. Доставка в пределах города включена в стоимость.'
  },
  {
    id: 2,
    name: 'Шкаф-купе',
    customer: 'Петрова Е.С.',
    status: 'В работе',
    endDate: '2025-04-15',
    startDate: '2025-04-05',
    duration: 10,
    price: 35000,
    cost: 18500,
    profit: 16500,
    profitPercent: 47,
    expenses: [
      {
        id: 1,
        name: 'Материалы',
        cost: 15000
      },
      {
        id: 2,
        name: 'Фурнитура',
        cost: 3500
      }
    ],
    notes: 'Шкаф с зеркалами на дверях.'
  },
  {
    id: 3,
    name: 'Кухонный гарнитур',
    customer: 'Сидоров В.М.',
    status: 'Ожидает',
    endDate: '2025-04-25',
    startDate: '2025-04-10',
    duration: 15,
    price: 85000,
    cost: 42000,
    profit: 43000,
    profitPercent: 51,
    expenses: [
      {
        id: 1,
        name: 'Материалы',
        cost: 30000
      },
      {
        id: 2,
        name: 'Столешница',
        cost: 12000
      }
    ],
    notes: 'Кухня угловая, со встроенной техникой.'
  },
  {
    id: 4,
    name: 'Прихожая',
    customer: 'Козлова Н.И.',
    status: 'В работе',
    endDate: '2025-04-18',
    startDate: '2025-04-08',
    duration: 10,
    price: 27000,
    cost: 14800,
    profit: 12200,
    profitPercent: 45,
    expenses: [
      {
        id: 1,
        name: 'Материалы',
        cost: 10000
      },
      {
        id: 2,
        name: 'Зеркало',
        cost: 4800
      }
    ],
    notes: 'Компактная прихожая с зеркалом и вешалкой.'
  }
];

// Функция для очистки старых фотографий
const cleanupOldPhotos = (photos) => {
  return (photos || []).slice(-10);
};

// Получение всех заказов
export const getOrders = () => {
  try {
    const ordersJson = localStorage.getItem(STORE_NAME);
    if (ordersJson) {
      return { orders: JSON.parse(ordersJson) };
    }
    return { orders: initialOrders };
  } catch (error) {
    console.error('Error getting orders:', error);
    return { orders: [] };
  }
};

// Получение заказа по ID
export const getOrderById = (id) => {
  const { orders } = getOrders();
  return orders.find(order => order.id === id) || null;
};

// Сохранение заказов
export const saveOrders = async (orders) => {
  try {
    // Генерируем временные id для новых заказов
    const ordersWithIds = orders.map(order => {
      if (!order.id) {
        // Генерируем уникальный временный id
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return {
          ...order,
          id: `temp-${timestamp}-${random}`
        };
      }
      return order;
    });

    // Очищаем старые фотографии для каждого заказа
    const cleanedOrders = ordersWithIds.map(order => ({
      ...order,
      photos: cleanupOldPhotos(order.photos)
    }));

    localStorage.setItem(STORE_NAME, JSON.stringify(cleanedOrders));
    return true;
  } catch (error) {
    console.error('Error saving orders:', error);
    return false;
  }
};

// Восстановление из резервной копии
export const restoreFromBackup = () => {
  try {
    const backup = localStorage.getItem('orders_backup');
    if (!backup) return false;
    
    const { orders, version } = JSON.parse(backup);
    localStorage.setItem(STORE_NAME, JSON.stringify(orders));
    localStorage.setItem('ordersVersion', version.toString());
    
    return true;
  } catch (error) {
    console.error('Ошибка при восстановлении из резервной копии:', error);
    return false;
  }
};

// Удаление заказа
export const deleteOrder = async (id) => {
  try {
    const { orders } = getOrders();
    const updatedOrders = orders.filter(order => order.id !== id);
    await saveOrders(updatedOrders);
    return true;
  } catch (error) {
    console.error('Error deleting order:', error);
    return false;
  }
}; 