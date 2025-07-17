# Настройка Appwrite для системы учета показаний счетчиков

## Шаг 1: Создание проекта

1. Зайдите на [Appwrite Cloud](https://cloud.appwrite.io/)
2. Создайте новый аккаунт или войдите в существующий
3. Создайте новый проект с именем "Meter Readings System"
4. Скопируйте Project ID из настроек проекта

## Шаг 2: Создание базы данных

1. Перейдите в раздел "Databases"
2. Создайте новую базу данных с ID: `meters_db`
3. Название: "Meters Database"

## Шаг 3: Создание коллекций

### Коллекция 1: cities
- **ID коллекции**: `cities`
- **Название**: "Cities"
- **Разрешения**: 
  - Read: `any`
  - Write: `any`

**Атрибуты:**
- `name` (string, required, size: 100) - Название города

**Индексы:**
- `name_index` (key) - для атрибута `name`

### Коллекция 2: meter_types
- **ID коллекции**: `meter_types`
- **Название**: "Meter Types"
- **Разрешения**: 
  - Read: `any`
  - Write: `any`

**Атрибуты:**
- `name` (string, required, size: 50) - Тип счетчика

**Индексы:**
- `name_index` (key) - для атрибута `name`

### Коллекция 3: meters
- **ID коллекции**: `meters`
- **Название**: "Meters"
- **Разрешения**: 
  - Read: `any`
  - Write: `any`

**Атрибуты:**
- `city_id` (string, required, size: 36) - ID города
- `meter_type_id` (string, required, size: 36) - ID типа счетчика
- `prev_date` (datetime, required) - Дата предыдущих показаний
- `prev_reading` (float, required) - Предыдущие показания

**Индексы:**
- `city_index` (key) - для атрибута `city_id`
- `meter_type_index` (key) - для атрибута `meter_type_id`
- `city_meter_type_index` (key) - для атрибутов `city_id`, `meter_type_id`

### Коллекция 4: meter_readings
- **ID коллекции**: `meter_readings`
- **Название**: "Meter Readings"
- **Разрешения**: 
  - Read: `any`
  - Write: `any`

**Атрибуты:**
- `meter_id` (string, required, size: 36) - ID счетчика
- `reading_date` (datetime, required) - Дата показаний
- `reading` (float, required) - Показания

**Индексы:**
- `meter_index` (key) - для атрибута `meter_id`
- `date_index` (key) - для атрибута `reading_date`
- `meter_date_index` (key) - для атрибутов `meter_id`, `reading_date`

### Коллекция 5: tariffs
- **ID коллекции**: `tariffs`
- **Название**: "Tariffs"
- **Разрешения**: 
  - Read: `any`
  - Write: `any`

**Атрибуты:**
- `city_id` (string, required, size: 36) - ID города
- `meter_type_id` (string, required, size: 36) - ID типа счетчика
- `tariff` (float, required) - Тариф
- `start_date` (datetime, required) - Дата начала действия
- `end_date` (datetime, optional) - Дата окончания действия

**Индексы:**
- `city_index` (key) - для атрибута `city_id`
- `meter_type_index` (key) - для атрибута `meter_type_id`
- `city_meter_type_index` (key) - для атрибутов `city_id`, `meter_type_id`
- `active_tariffs_index` (key) - для атрибутов `city_id`, `meter_type_id`, `end_date`

## Шаг 4: Заполнение начальных данных

### Города
```json
[
  {"name": "Москва"},
  {"name": "СПб, Кузнецова 45"},
  {"name": "Тула"}
]
```

### Типы счетчиков
```json
[
  {"name": "электричество"},
  {"name": "горячая вода"},
  {"name": "холодная вода"}
]
```

## Шаг 5: Настройка конфигурации

1. Откройте файл `config.js`
2. Замените `YOUR_PROJECT_ID` на ваш Project ID из Appwrite
3. При необходимости измените endpoint (для self-hosted Appwrite)

```javascript
const APPWRITE_CONFIG = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: 'YOUR_PROJECT_ID', // Замените на ваш Project ID
    databaseId: 'meters_db',
    // ...
};
```

## Шаг 6: Настройка разрешений (Security)

### Для продакшена рекомендуется:

1. Создать роли пользователей:
   - `admin` - полный доступ
   - `user` - ограниченный доступ

2. Настроить разрешения для каждой коллекции:
   - **cities**: Read - `any`, Write - `role:admin`
   - **meter_types**: Read - `any`, Write - `role:admin`
   - **meters**: Read - `any`, Write - `role:admin`
   - **meter_readings**: Read - `any`, Write - `users`
   - **tariffs**: Read - `any`, Write - `role:admin`

3. Настроить аутентификацию:
   - Включить Email/Password аутентификацию
   - Настроить регистрацию пользователей

## Шаг 7: Миграция данных (опционально)

Если у вас есть существующие данные из PostgreSQL:

1. Экспортируйте данные из PostgreSQL в JSON формат
2. Используйте Appwrite CLI или API для массового импорта
3. Или создайте скрипт миграции используя Appwrite SDK

## Шаг 8: Тестирование

1. Откройте `index.html` в браузере
2. Проверьте загрузку городов
3. Попробуйте ввести показания
4. Проверьте работу истории и тарифов

## Полезные команды Appwrite CLI

```bash
# Установка CLI
npm install -g appwrite-cli

# Логин
appwrite login

# Инициализация проекта
appwrite init project

# Создание коллекций из конфигурации
appwrite deploy collections

# Создание индексов
appwrite deploy indexes
```

## Мониторинг и отладка

1. Используйте Appwrite Console для мониторинга запросов
2. Проверяйте логи в разделе "Functions" (если используете)
3. Используйте браузерные инструменты разработчика для отладки

## Резервное копирование

1. Настройте автоматическое резервное копирование в Appwrite
2. Регулярно экспортируйте данные через API
3. Ведите версионирование схемы базы данных

## Производительность

1. Создавайте индексы для часто используемых запросов
2. Используйте пагинацию для больших выборок
3. Кэшируйте часто запрашиваемые данные
4. Оптимизируйте запросы с помощью Query filters

## Безопасность

1. Никогда не храните API ключи в frontend коде
2. Используйте HTTPS для всех запросов
3. Настройте CORS правильно
4. Регулярно обновляйте разрешения
5. Мониторьте подозрительную активность 