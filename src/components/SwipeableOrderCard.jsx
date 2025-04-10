import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { Trash2 } from 'lucide-react';

const SwipeableOrderCard = ({ order, children, theme, onDelete, onClick }) => {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onDelete?.setSwipedOrderId(order.id),
    onSwipedRight: () => onDelete?.setSwipedOrderId(null),
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
    delta: 10
  });

  const handleClick = (e) => {
    console.log('SwipeableOrderCard handleClick:', { 
      orderId: order?.id,
      swipedOrderId: onDelete?.swipedOrderId,
      hasOnClick: !!onClick
    });

    if (onDelete?.swipedOrderId === order.id) {
      console.log('Click blocked due to swipe');
      return;
    }
    
    e.stopPropagation();
    
    if (onClick && order?.id) {
      console.log('Calling onClick with orderId:', order.id);
      onClick(order.id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete?.handleDeleteOrder) {
      onDelete.handleDeleteOrder(order.id);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        {...swipeHandlers}
        className="relative z-10 transition-transform duration-200 cursor-pointer"
        style={{
          transform: onDelete?.swipedOrderId === order.id ? 'translateX(-80px)' : 'translateX(0)',
          backgroundColor: theme.card
        }}
        onClick={handleClick}
      >
        {children}
      </div>
      {onDelete?.swipedOrderId === order.id && (
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

export default SwipeableOrderCard; 