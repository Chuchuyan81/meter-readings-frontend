// Скрипт для настройки CORS в Appwrite через API
// ВАЖНО: Этот скрипт требует API ключи с правами администратора

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const { Client, Projects, Teams } = require('node-appwrite');

// Конфигурация
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "68790cc0001f9d5ee482";

const API_KEY = process.env.APPWRITE_API_KEY && process.env.APPWRITE_API_KEY.trim();
if (!API_KEY) {
    console.error('Задайте APPWRITE_API_KEY в файле .env (скопируйте из .env.example и вставьте ключ).');
    process.exit(1);
}

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

1. Скопируйте .env.example в .env и укажите APPWRITE_API_KEY (серверный ключ из Appwrite).

2. Установите зависимости: npm install

3. Запустите: node setup-cors.js

Вручную в консоли: https://cloud.appwrite.io → проект → Settings → Platforms → добавьте web-платформу с hostname chuchuyan81.github.io
`);

// Запускаем настройку CORS
setupCORS(); 