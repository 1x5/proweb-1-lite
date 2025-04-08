import React from 'react';
import SwipeableOrderCard from './SwipeableOrderCard';

const RegularOrderCard = ({ order, isMobile, theme, formatDate, getStatusColor, onClick, onDelete }) => (
  <SwipeableOrderCard order={order} theme={theme} onClick={onClick} onDelete={onDelete}>
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
            fontSize: '0.75rem'
          }}>
            {order.profitPercent}%
          </span>
        </div>
      </div>
    </div>
  </SwipeableOrderCard>
);

export default RegularOrderCard; 