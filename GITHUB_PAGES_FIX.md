# Исправление проблемы с GitHub Pages

## Проблема
Основная страница на GitHub Pages (`https://chuchuyan81.github.io/meter-readings-frontend/index.html`) не работает из-за CORS ошибок.

## Причины
1. **CORS политика**: Appwrite настроен только на `https://localhost`
2. **GitHub Pages**: Использует HTTPS домен, который не разрешен в настройках Appwrite
3. **Origin mismatch**: GitHub Pages отправляет другой origin, чем ожидает Appwrite

## Решения

### Вариант 1: Настройка CORS в Appwrite (Рекомендуется)

1. **Войдите в консоль Appwrite**
   - Откройте https://cloud.appwrite.io/console
   - Выберите ваш проект

2. **Добавьте домен GitHub Pages в настройки**
   - Перейдите в Settings → Security
   - В разделе "Platforms" добавьте:
     ```
     Domain: chuchuyan81.github.io
     Protocol: https
     ```

3. **Проверьте настройки**
   - Убедитесь, что домен добавлен в список разрешенных
   - Сохраните изменения

### Вариант 2: Использование локального сервера для разработки

Для разработки и тестирования используйте локальный сервер:

```bash
# Установка http-server
npm install -g http-server

# Запуск сервера
http-server -p 8081

# Откройте в браузере
http://localhost:8081
```

### Вариант 3: Настройка GitHub Pages для работы с Appwrite

Если у вас есть доступ к настройкам Appwrite, добавьте следующие домены:

```
chuchuyan81.github.io
*.github.io
```

## Тестирование

### Локальное тестирование
1. Запустите локальный сервер: `http-server -p 8081`
2. Откройте: `http://localhost:8081`
3. Проверьте функциональность сохранения

### Тестирование на GitHub Pages
1. После настройки CORS в Appwrite
2. Откройте: `https://chuchuyan81.github.io/meter-readings-frontend/`
3. Проверьте работу сохранения

## Диагностика

### Проверка CORS ошибок
Откройте консоль браузера (F12) и проверьте:
- Ошибки CORS
- Статус подключения к Appwrite
- Логи инициализации

### Тестовые страницы
- `http://localhost:8081/test-save.html` - тест сохранения
- `http://localhost:8081/test-main.html` - полная диагностика

## Альтернативные решения

### 1. Использование Netlify
- Загрузите проект на Netlify
- Настройте кастомный домен
- Добавьте домен в Appwrite

### 2. Использование Vercel
- Подключите GitHub репозиторий к Vercel
- Получите кастомный домен
- Настройте CORS в Appwrite

### 3. Прокси-сервер
Создайте простой прокси для обхода CORS:

```javascript
// proxy.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api', createProxyMiddleware({
  target: 'https://cloud.appwrite.io',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/v1'
  }
}));

app.listen(3000);
```

## Рекомендации

1. **Для разработки**: Используйте локальный сервер (`http://localhost:8081`)
2. **Для продакшена**: Настройте CORS в Appwrite для вашего домена
3. **Для тестирования**: Используйте созданные тестовые страницы

## Контакты для поддержки

Если проблема не решается:
1. Проверьте логи в консоли браузера
2. Убедитесь, что Appwrite проект настроен правильно
3. Проверьте права доступа к коллекциям в Appwrite 