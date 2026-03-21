require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const { Client, Projects } = require('node-appwrite');

const apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey || !apiKey.trim()) {
    console.error('Укажите APPWRITE_API_KEY в файле .env (см. .env.example).');
    process.exit(1);
}

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('68790cc0001f9d5ee482')
    .setKey(apiKey.trim());

const projects = new Projects(client);

async function addGitHubPagesPlatform() {
    try {
        console.log('🚀 Начинаем добавление платформы для GitHub Pages...');
        
        // Добавляем платформу для GitHub Pages
        const platform = await projects.createPlatform(
            '68790cc0001f9d5ee482',
            'web',
            'GitHub Pages',
            'chuchuyan81.github.io'
        );
        
        console.log('✅ Платформа добавлена успешно!');
        console.log('ID:', platform.$id);
        console.log('Name:', platform.name);
        console.log('Hostname:', platform.hostname);
        console.log('Type:', platform.type);
        
        console.log('🎉 CORS настроен! Теперь GitHub Pages должен работать.');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        
        if (error.code === 409) {
            console.log('ℹ️ Платформа уже существует');
        } else if (error.code === 401) {
            console.log('🔐 Ошибка авторизации. Проверьте API ключ');
        } else {
            console.log('🔍 Полная ошибка:', error);
        }
    }
}

addGitHubPagesPlatform(); 