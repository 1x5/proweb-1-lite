// Сервис для работы с заказами
const ORDERS_KEY = 'furniture_orders';

// Получение всех заказов
export const getOrders = () => {
  const orders = localStorage.getItem(ORDERS_KEY);
  return orders ? JSON.parse(orders) : getInitialOrders();
};

// Получение заказа по ID
export const getOrderById = (id) => {
  const orders = getOrders();
  return orders.find(order => order.id === parseInt(id));
};

// Сохранение заказа (добавление или обновление)
export const saveOrder = (order) => {
  const orders = getOrders();
  
  // Если заказ с таким ID уже существует, обновляем его
  const index = orders.findIndex(o => o.id === order.id);
  
  if (index !== -1) {
    orders[index] = order;
  } else {
    // Иначе добавляем новый заказ с новым ID
    const maxId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) : 0;
    orders.push({
      ...order,
      id: order.id || maxId + 1
    });
  }
  
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return order;
};

// Удаление заказа
export const deleteOrder = (id) => {
  const orders = getOrders();
  const updatedOrders = orders.filter(order => order.id !== parseInt(id));
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
  return updatedOrders;
};

// Начальные данные для демонстрации
const getInitialOrders = () => [
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
    profitPercent: 56.2,
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
    profitPercent: 47.1,
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
    profitPercent: 50.6,
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
    profitPercent: 45.2,
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