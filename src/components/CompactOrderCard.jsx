import React from 'react';
import SwipeableOrderCard from './SwipeableOrderCard';

const CompactOrderCard = ({ order, isMobile, theme, getStatusColor, onClick, onDelete }) => {
  // Форматирование даты в формат дд.мм
  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  const handleClick = () => {
    console.log('CompactOrderCard handleClick:', {
      orderId: order?.id,
      hasOnClick: !!onClick
    });
    if (onClick && order?.id) {
      onClick(order.id);
    }
  };

  return (
    <SwipeableOrderCard 
      order={order} 
      theme={theme} 
      onClick={handleClick} 
      onDelete={onDelete}
    >
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
          </div>
        </div>
      </div>
    </SwipeableOrderCard>
  );
};

export default CompactOrderCard; 