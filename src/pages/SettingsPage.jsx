import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, Edit2, Save, Sun, Moon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { useTheme } from '../contexts/ThemeContext';
import { hashPassword } from '../utils/crypto';

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

const SettingsPage = ({ onLogout }) => {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [displayPassword, setDisplayPassword] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showSuccessBar, setShowSuccessBar] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSaveSettings = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        let hasChanges = false;
        
        // Сбрасываем ошибки
        setEmailError('');
        setPasswordError('');
        
        // Проверяем email только если он был изменен и отличается от текущего
        if (newEmail && newEmail !== email) {
          if (!/\S+@\S+\.\S+/.test(newEmail)) {
            setEmailError('Введите корректный email');
            reject('validation');
            return;
          }
          
          localStorage.setItem('userEmail', newEmail);
          setEmail(newEmail);
          hasChanges = true;
        }
        
        // Проверяем пароль только если он был введен
        if (newPassword) {
          if (newPassword.length < 6) {
            setPasswordError('Пароль должен содержать минимум 6 символов');
            reject('validation');
            return;
          }
          
          // Сохраняем пароль
          const hashedPassword = hashPassword(newPassword);
          localStorage.setItem('userPassword', hashedPassword);
          setDisplayPassword('••••••');
          hasChanges = true;
        }
        
        // Очищаем поля ввода и показываем уведомление только при реальных изменениях
        if (hasChanges) {
          setIsSaving(true);
          setNewEmail('');
          setNewPassword('');
          setShowPassword(false);
          setEditMode(false);
          setShowSuccessBar(true);
          setTimeout(() => {
            setShowSuccessBar(false);
            setIsSaving(false);
          }, 1000);
        } else {
          // Если изменений не было, просто выходим из режима редактирования
          setEditMode(false);
        }
        
        resolve(hasChanges);
      } catch (error) {
        console.error('Произошла ошибка при сохранении:', error);
        setIsSaving(false);
        reject('error');
      }
    });
  }, [newEmail, newPassword, email]);
  
  // Загрузка данных пользователя из localStorage при монтировании компонента
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail') || 'admin';
    
    setEmail(storedEmail);
    setDisplayPassword('••••••'); // Показываем фиксированное количество точек вместо реального пароля
  }, []);
  
  // Инициализация значений при входе в режим редактирования
  useEffect(() => {
    if (editMode) {
      setNewEmail(email);
      setNewPassword(''); // Очищаем поле пароля при входе в режим редактирования
    }
  }, [editMode, email]);
  
  // Обработчик нажатия клавиш (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Проверяем, что нажата клавиша S вместе с Cmd (Mac) или Ctrl (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Предотвращаем стандартное поведение браузера
        if (editMode) {
          handleSaveSettings()
            .then((hasChanges) => {
              if (hasChanges) {
                setEditMode(false);
              }
            })
            .catch((error) => {
              console.error('Ошибка при сохранении:', error);
            });
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
  
  const handleLogoutClick = () => {
    console.log('Выход из системы...');
    onLogout();
  };
  
  const toggleEditMode = () => {
    if (editMode) {
      // Сохраняем изменения при выходе из режима редактирования
      handleSaveSettings()
        .then((hasChanges) => {
          if (hasChanges) {
            setEditMode(false);
          }
        })
        .catch((type) => {
          // Не выходим из режима редактирования при ошибках валидации
          if (type !== 'validation') {
            console.error('Системная ошибка при сохранении настроек');
          }
        });
    } else {
      setEditMode(true);
    }
  };
  
  return (
    <>
      <style>{progressAnimation}</style>
      <div className="flex flex-col h-screen relative" style={{ backgroundColor: theme.bg }}>
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
              onClick={toggleEditMode}
              data-save-settings
            >
              {editMode ? <Save size={20} color="#ffffff" /> : <Edit2 size={20} color="#ffffff" />}
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
                    <>
                      <input 
                        type="email" 
                        value={newEmail}
                        onChange={(e) => {
                          setNewEmail(e.target.value);
                          setEmailError('');
                        }}
                        className="w-full p-1 rounded"
                        style={{ 
                          backgroundColor: theme.inputBg, 
                          color: theme.textPrimary,
                          border: emailError ? '1px solid #ef4444' : 'none'
                        }}
                        placeholder="Введите новый email"
                      />
                      {emailError && (
                        <div className="text-sm mt-1" style={{ color: '#ef4444' }}>
                          {emailError}
                        </div>
                      )}
                    </>
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
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPasswordError('');
                        }}
                        className="flex-1 p-1 rounded"
                        style={{ 
                          backgroundColor: theme.inputBg, 
                          color: theme.textPrimary,
                          border: passwordError ? '1px solid #ef4444' : 'none'
                        }}
                        placeholder="Введите новый пароль"
                      />
                    ) : (
                      <div className="flex-1" style={{ color: theme.textPrimary }}>
                        {showPassword ? 'Пароль скрыт' : displayPassword}
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
                  {passwordError && (
                    <div className="text-sm mt-1" style={{ color: '#ef4444' }}>
                      {passwordError}
                    </div>
                  )}
                </div>
              </div>
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
    </>
  );
};

export default SettingsPage; 