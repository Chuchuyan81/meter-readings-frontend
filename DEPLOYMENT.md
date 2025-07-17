# Деплой фронтенда на GitHub Pages

## Подготовка репозитория

1. **Создайте новый репозиторий на GitHub:**
   - Перейдите на [GitHub](https://github.com)
   - Нажмите "New repository"
   - Назовите репозиторий: `meter-readings-frontend`
   - Сделайте его публичным
   - Не добавляйте README, .gitignore или лицензию (у нас уже есть)

2. **Инициализируйте Git в папке frontend:**
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Initial commit: Meter readings system frontend"
   ```

3. **Подключите удаленный репозиторий:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/meter-readings-frontend.git
   git branch -M main
   git push -u origin main
   ```

## Настройка GitHub Pages

1. **Включите GitHub Pages:**
   - Перейдите в настройки репозитория (Settings)
   - Прокрутите до раздела "Pages"
   - В качестве источника выберите "Deploy from a branch"
   - Выберите ветку `gh-pages`
   - Нажмите "Save"

2. **Настройте GitHub Actions:**
   - GitHub Actions уже настроен через файл `.github/workflows/deploy.yml`
   - При каждом push в ветку `main` будет автоматически происходить деплой

## Настройка Appwrite для продакшена

1. **Обновите CORS настройки в Appwrite:**
   - Перейдите в настройки проекта Appwrite
   - Добавьте домен GitHub Pages в список разрешенных:
     ```
     https://YOUR_USERNAME.github.io
     ```

2. **Настройте конфигурацию:**
   - Убедитесь, что в `config.js` указан правильный Project ID
   - Не коммитьте файлы с чувствительными данными

## Процесс деплоя

### Автоматический деплой

1. **Внесите изменения в код**
2. **Закоммитьте и отправьте на GitHub:**
   ```bash
   git add .
   git commit -m "Update: описание изменений"
   git push origin main
   ```
3. **GitHub Actions автоматически:**
   - Скопирует файлы в папку деплоя
   - Отправит их в ветку `gh-pages`
   - Обновит сайт на GitHub Pages

### Ручной деплой

Если нужно развернуть вручную:

```bash
# Создайте папку для деплоя
mkdir deploy
cp -r * deploy/

# Переключитесь на ветку gh-pages
git checkout -b gh-pages

# Очистите ветку и скопируйте файлы
git rm -rf .
cp -r deploy/* .
rm -rf deploy

# Закоммитьте и отправьте
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

# Вернитесь на main
git checkout main
```

## Доступ к сайту

После успешного деплоя ваш сайт будет доступен по адресу:
```
https://YOUR_USERNAME.github.io/meter-readings-frontend/
```

## Настройка пользовательского домена (опционально)

1. **Купите домен** у любого регистратора
2. **Настройте DNS записи:**
   ```
   CNAME: www.yourdomain.com -> YOUR_USERNAME.github.io
   A: yourdomain.com -> 185.199.108.153
   A: yourdomain.com -> 185.199.109.153
   A: yourdomain.com -> 185.199.110.153
   A: yourdomain.com -> 185.199.111.153
   ```
3. **Добавьте домен в настройки GitHub Pages**
4. **Обновите CORS настройки в Appwrite**

## Мониторинг и отладка

### Проверка статуса деплоя

1. Перейдите в раздел "Actions" вашего репозитория
2. Проверьте статус последнего workflow
3. Если есть ошибки, изучите логи

### Отладка проблем

1. **Сайт не загружается:**
   - Проверьте, что GitHub Pages включен
   - Убедитесь, что ветка `gh-pages` существует
   - Проверьте настройки репозитория

2. **Ошибки Appwrite:**
   - Проверьте CORS настройки
   - Убедитесь, что Project ID правильный
   - Проверьте разрешения коллекций

3. **Проблемы с GitHub Actions:**
   - Проверьте логи в разделе Actions
   - Убедитесь, что все файлы закоммичены
   - Проверьте синтаксис YAML файла

## Обновление

Для обновления сайта:

1. Внесите изменения в код
2. Закоммитьте изменения
3. Отправьте на GitHub
4. Деплой произойдет автоматически

## Резервное копирование

Регулярно создавайте резервные копии:

```bash
# Создайте архив
tar -czf backup-$(date +%Y%m%d).tar.gz frontend/

# Или используйте Git теги для версионирования
git tag -a v1.0 -m "Version 1.0"
git push origin v1.0
```

## Безопасность

1. **Никогда не коммитьте:**
   - API ключи
   - Пароли
   - Токены доступа

2. **Используйте переменные окружения** для чувствительных данных

3. **Регулярно обновляйте зависимости**

4. **Мониторьте доступ** к репозиторию

## Полезные команды

```bash
# Проверить статус Git
git status

# Посмотреть историю коммитов
git log --oneline

# Создать новую ветку для функции
git checkout -b feature/new-feature

# Слить ветку
git checkout main
git merge feature/new-feature

# Удалить ветку
git branch -d feature/new-feature

# Откатить изменения
git reset --hard HEAD~1

# Посмотреть различия
git diff
``` 