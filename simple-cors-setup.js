const { Client, Projects } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('68790cc0001f9d5ee482')
    .setKey('standard_004ffb9fe334a79a700b6458572237392550ab90d400275fde1cf51ff0ceae22babed0ca955832e01ba74369b117826367f9db559c0987fa6c64a9ca287f5ae75e4040616d36705b1d86d902da5b4348c438b08e11f344978ddb480bef8fd30a2d2ab5eed1cfee6c0580f2c861766bb807201af18cade268babd59238f2580e9');

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