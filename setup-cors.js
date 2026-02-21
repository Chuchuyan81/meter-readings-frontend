// Скрипт для настройки CORS в Appwrite через API
// ВАЖНО: Этот скрипт требует API ключи с правами администратора

const { Client, Projects, Teams } = require('node-appwrite');

// Конфигурация
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "68790cc0001f9d5ee482";
const API_KEY = "standard_004ffb9fe334a79a700b6458572237392550ab90d400275fde1cf51ff0ceae22babed0ca955832e01ba74369b117826367f9db559c0987fa6c64a9ca287f5ae75e4040616d36705b1d86d902da5b4348c438b08e11f344978ddb480bef8fd30a2d2ab5eed1cfee6c0580f2c861766bb807201af18cade268babd59238f2580e9";

async function setupCORS() {
    try {
        console.log('🚀 Начинаем настройку CORS...');
        
        // Инициализация клиента
        const client = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID)
            .setKey(API_KEY);

        const projects = new Projects(client);

        console.log('✅ Клиент Appwrite инициализирован');

        // Получаем текущие настройки проекта
        const project = await projects.get(APPWRITE_PROJECT_ID);
        console.log('📋 Текущие настройки проекта:', {
            name: project.name,
            platformCount: project.platforms?.length || 0
        });

        // Проверяем, есть ли уже платформа для GitHub Pages
        const existingPlatforms = project.platforms || [];
        const githubPlatform = existingPlatforms.find(p => 
            p.hostname === 'chuchuyan81.github.io' || 
            p.hostname === '*.github.io'
        );

        if (githubPlatform) {
            console.log('✅ Платформа для GitHub Pages уже существует:', githubPlatform);
            return;
        }

        console.log('➕ Добавляем платформу для GitHub Pages...');

        // Добавляем платформу для GitHub Pages
        const platform = await projects.createPlatform(
            APPWRITE_PROJECT_ID,
            'web',
            'GitHub Pages',
            'chuchuyan81.github.io'
        );

        console.log('✅ Платформа добавлена:', {
            id: platform.$id,
            name: platform.name,
            hostname: platform.hostname,
            type: platform.type
        });

        // Также добавляем wildcard для всех GitHub Pages
        try {
            const wildcardPlatform = await projects.createPlatform(
                APPWRITE_PROJECT_ID,
                'web',
                'GitHub Pages Wildcard',
                '*.github.io'
            );
            console.log('✅ Wildcard платформа добавлена:', wildcardPlatform.hostname);
        } catch (wildcardError) {
            console.log('ℹ️ Wildcard платформа уже существует или не может быть добавлена');
        }

        console.log('🎉 CORS настроен успешно!');
        console.log('📝 Теперь GitHub Pages должен работать с Appwrite');

    } catch (error) {
        console.error('❌ Ошибка настройки CORS:', error.message);
        
        if (error.code === 401) {
            console.error('🔐 Ошибка авторизации. Проверьте API ключ и права доступа.');
        } else if (error.code === 409) {
            console.error('⚠️ Платформа уже существует.');
        } else {
            console.error('🔍 Детали ошибки:', error);
        }
    }
}

// Инструкции по использованию
console.log(`
=== ИНСТРУКЦИЯ ПО НАСТРОЙКЕ CORS ===

1. Получите API ключ в консоли Appwrite:
   - Перейдите в Settings → API Keys
   - Создайте новый ключ с правами администратора
   - Скопируйте ключ

2. Замените YOUR_API_KEY_HERE на ваш API ключ

3. Установите зависимости:
   npm install node-appwrite

4. Запустите скрипт:
   node setup-cors.js

АЛЬТЕРНАТИВНО - настройте вручную через консоль:
1. Откройте https://cloud.appwrite.io/console
2. Выберите проект
3. Settings → Security → Platforms
4. Добавьте платформу:
   - Name: GitHub Pages
   - Hostname: chuchuyan81.github.io
   - Protocol: https
`);

// Запускаем настройку CORS
setupCORS(); 