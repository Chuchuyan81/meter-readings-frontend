// Конфигурация Appwrite
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "68790cc0001f9d5ee482";

// ID базы данных и коллекций
const DATABASE_ID = "meter_readings_db";
const CITIES_COLLECTION_ID = "cities";
const METER_TYPES_COLLECTION_ID = "meter_types";
const METERS_COLLECTION_ID = "meters";
const TARIFFS_COLLECTION_ID = "tariffs";
const METER_READINGS_COLLECTION_ID = "meter_readings";

// Делаем константы доступными глобально
window.APPWRITE_ENDPOINT = APPWRITE_ENDPOINT;
window.APPWRITE_PROJECT_ID = APPWRITE_PROJECT_ID;
window.DATABASE_ID = DATABASE_ID;
window.CITIES_COLLECTION_ID = CITIES_COLLECTION_ID;
window.METER_TYPES_COLLECTION_ID = METER_TYPES_COLLECTION_ID;
window.METERS_COLLECTION_ID = METERS_COLLECTION_ID;
window.TARIFFS_COLLECTION_ID = TARIFFS_COLLECTION_ID;
window.METER_READINGS_COLLECTION_ID = METER_READINGS_COLLECTION_ID;

// Инициализация клиента Appwrite
let client;
let databases;
let account;

function initAppwrite() {
    try {
        // Проверяем, что Appwrite SDK загружен
        if (typeof Appwrite === 'undefined') {
            console.error('Appwrite SDK не загружен');
            return false;
        }

        const { Client, Databases, Account } = Appwrite;
        
        client = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID);
        
        databases = new Databases(client);
        account = new Account(client);
        
        console.log('Appwrite клиент инициализирован');
        return true;
    } catch (error) {
        console.error('Ошибка инициализации Appwrite:', error);
        return false;
    }
}

// Функция для анонимной авторизации
async function createAnonymousSession() {
    try {
        if (!account) {
            console.error('Account не инициализирован');
            return false;
        }
        
        const session = await account.createAnonymousSession();
        console.log('Анонимная сессия создана:', session);
        return true;
    } catch (error) {
        console.error('Ошибка создания анонимной сессии:', error);
        return false;
    }
}

// Проверка подключения к Appwrite
async function testAppwriteConnection() {
    try {
        // Сначала создаем анонимную сессию
        const authResult = await createAnonymousSession();
        if (!authResult) {
            console.error('Не удалось создать анонимную сессию');
            return false;
        }
        
        const response = await databases.list();
        console.log('Подключение к Appwrite успешно');
        return true;
    } catch (error) {
        console.error('Ошибка подключения к Appwrite:', error);
        return false;
    }
}

// Делаем функции доступными глобально
window.initAppwrite = initAppwrite;
window.testAppwriteConnection = testAppwriteConnection;
window.createAnonymousSession = createAnonymousSession;
window.client = client;
window.databases = databases;
window.account = account; 