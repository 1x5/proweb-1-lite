import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Хук для глобальных горячих клавиш в приложении
 */
const useGlobalHotkeys = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+N или Ctrl+N - создать новый заказ
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/order/new');
      }
      
      // Cmd+, или Ctrl+, - открыть настройки
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
      }
      
      // Cmd+S или Ctrl+S на странице настроек - сохранить настройки
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && location.pathname === '/settings') {
        e.preventDefault();
        // Найдем кнопку сохранения и эмулируем клик
        const saveButton = document.querySelector('[data-save-settings]');
        if (saveButton) {
          saveButton.click();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, location.pathname]);
};

export default useGlobalHotkeys; 