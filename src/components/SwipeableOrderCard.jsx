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

  const handleDelete = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onDelete?.handleDeleteOrder(order.id);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        {...swipeHandlers}
        className="relative z-10 transition-transform duration-200"
        style={{
          transform: onDelete?.swipedOrderId === order.id ? 'translateX(-80px)' : 'translateX(0)',
          backgroundColor: theme.card
        }}
        onClick={() => onClick?.(order.id)}
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