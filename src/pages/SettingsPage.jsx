import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, Edit2, Check, Sun, Moon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
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
`;

const SettingsPage = ({ onLogout }) => {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayPassword, setDisplayPassword] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSaveSettings = useCallback(() => {
    // Проверка валидности email
    if (newEmail && !/\S+@\S+\.\S+/.test(newEmail)) {
      setSaveMessage('Некорректный email');
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }
    
    // Проверка длины пароля
    if (newPassword && newPassword.length < 6) {
      setSaveMessage('Пароль должен содержать минимум 6 символов');
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }
    
    // Сохраняем новые значения
    if (newEmail) setEmail(newEmail);
    if (newPassword) {
      setPassword(newPassword);
      setDisplayPassword('•'.repeat(newPassword.length));
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('userEmail', newEmail || email);
    localStorage.setItem('userPassword', newPassword || password);
    
    setSaveMessage('Настройки сохранены');
    setTimeout(() => setSaveMessage(''), 2000);
    setEditMode(false);
  }, [newEmail, newPassword, email, password]);
  
  // Загрузка данных пользователя из localStorage при монтировании компонента
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail') || 'admin';
    const storedPassword = localStorage.getItem('userPassword') || 'password';
    
    setEmail(storedEmail);
    setPassword(storedPassword);
    setDisplayPassword('•'.repeat(storedPassword.length));
    setIsInitialized(true);
  }, []);
  
  // Инициализация значений при входе в режим редактирования
  useEffect(() => {
    if (editMode) {
      setNewEmail(email);
      setNewPassword(password);
    }
  }, [editMode, email, password]);
  
  // Обработчик нажатия клавиш (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Проверяем, что нажата клавиша S вместе с Cmd (Mac) или Ctrl (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Предотвращаем стандартное поведение браузера
        if (editMode) {
          handleSaveSettings();
        }
      }
    };
    
    // Добавляем обработчик события
    window.addEventListener('keydown', handleKeyDown);
    
    // Удаляем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editMode, handleSaveSettings]);
  
  useEffect(() => {
    if (isInitialized) {
      handleSaveSettings();
    }
  }, [isInitialized, handleSaveSettings]);
  
  const handleCancelEdit = () => {
    setNewEmail('');
    setNewPassword('');
    setEditMode(false);
  };
  
  const handleLogoutClick = () => {
    console.log('Выход из системы...');
    onLogout();
  };
  
  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: theme.bg }}>
      <style>{fadeInOutKeyframes}</style>
      {/* Верхняя панель */}
      <div className="p-3 flex justify-between items-center" style={{ backgroundColor: darkMode ? '#1a1a1a' : theme.bg }}>
        <div className="flex items-center">
          <ChevronLeft 
            size={24} 
            color={theme.textPrimary} 
            className="mr-2 cursor-pointer" 
            onClick={() => navigate('/')}
          />
          <h1 className="text-xl font-bold" style={{ color: theme.textPrimary }}>
            Настройки
          </h1>
        </div>
        
        <div className="flex items-center">
          {saveMessage && (
            <div className="mr-2 flex items-center justify-center rounded-full p-2" style={{ 
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
          
          <button 
            className="rounded-full p-2"
            style={{ backgroundColor: editMode ? theme.green : theme.accent }}
            onClick={editMode ? handleSaveSettings : () => setEditMode(true)}
            data-save-settings
          >
            {editMode ? <Check size={20} color="#ffffff" /> : <Edit2 size={20} color="#ffffff" />}
          </button>
        </div>
      </div>
      
      {/* Основное содержимое */}
      <div className="flex-1 overflow-auto px-3 pb-5">
        {/* Авторизация */}
        <div className="my-4">
          <h2 className="text-lg font-bold mb-2" style={{ color: theme.textPrimary }}>
            Авторизация
          </h2>
          
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card }}>
            {/* Email */}
            <div className="p-3 flex items-center" style={{ borderBottom: `1px solid ${theme.cardBorder}` }}>
              <Mail size={20} color={theme.textSecondary} className="mr-3" />
              <div className="flex-1">
                <div className="text-xs mb-1" style={{ color: theme.textSecondary }}>Email</div>
                {editMode ? (
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-1 rounded"
                    style={{ 
                      backgroundColor: theme.inputBg, 
                      color: theme.textPrimary,
                      border: 'none'
                    }}
                    placeholder="Введите новый email"
                  />
                ) : (
                  <div style={{ color: theme.textPrimary }}>{email}</div>
                )}
              </div>
            </div>
            
            {/* Пароль */}
            <div className="p-3 flex items-center">
              <Lock size={20} color={theme.textSecondary} className="mr-3" />
              <div className="flex-1">
                <div className="text-xs mb-1" style={{ color: theme.textSecondary }}>Пароль</div>
                <div className="flex items-center">
                  {editMode ? (
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 p-1 rounded"
                      style={{ 
                        backgroundColor: theme.inputBg, 
                        color: theme.textPrimary,
                        border: 'none'
                      }}
                      placeholder="Введите новый пароль"
                    />
                  ) : (
                    <div className="flex-1" style={{ color: theme.textPrimary }}>
                      {showPassword ? password : displayPassword}
                    </div>
                  )}
                  <button 
                    className="ml-2 p-1 rounded-full"
                    style={{ backgroundColor: theme.inputBg }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 
                      <EyeOff size={16} color={theme.textSecondary} /> : 
                      <Eye size={16} color={theme.textSecondary} />
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            {editMode && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="p-3 rounded-xl text-center"
                  style={{ 
                    backgroundColor: theme.card, 
                    color: theme.textSecondary 
                  }}
                  onClick={handleCancelEdit}
                >
                  Отмена
                </button>
                <button 
                  className="p-3 rounded-xl text-center"
                  style={{ 
                    backgroundColor: theme.accent, 
                    color: '#ffffff' 
                  }}
                  onClick={handleSaveSettings}
                >
                  Сохранить
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Кнопка выхода из системы */}
        <div className="my-4">
          <button 
            className="w-full p-3 rounded-xl text-center flex items-center justify-center"
            style={{ backgroundColor: theme.red, color: '#ffffff' }}
            onClick={handleLogoutClick}
          >
            <LogOut size={20} className="mr-2" />
            Выйти из системы
          </button>
        </div>
      </div>
      
      <BottomNavigation activePage="settings" />
    </div>
  );
};

export default SettingsPage; 