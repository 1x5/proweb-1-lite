import CryptoJS from 'crypto-js';

// Секретный ключ для дополнительного шифрования
const SECRET_KEY = 'your-secret-key-2024';

// Функция для хеширования пароля
export const hashPassword = (password) => {
  // Создаем соль из email пользователя и секретного ключа
  const salt = CryptoJS.SHA256(SECRET_KEY).toString();
  
  // Хешируем пароль с солью
  const hashedPassword = CryptoJS.SHA256(password + salt).toString();
  
  return hashedPassword;
};

// Функция для проверки пароля
export const verifyPassword = (password, hashedPassword) => {
  const salt = CryptoJS.SHA256(SECRET_KEY).toString();
  const newHashedPassword = CryptoJS.SHA256(password + salt).toString();
  
  return newHashedPassword === hashedPassword;
}; 