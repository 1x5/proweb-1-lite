FROM node:18-alpine

WORKDIR /app

# Установка зависимостей для работы с PostgreSQL
RUN apk add --no-cache postgresql-client

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Открываем порт для API
EXPOSE 3001

# Запускаем сервер
CMD ["npm", "run", "start"] 