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

// Инициализация клиента Appwrite
let client;
let databases;

function initAppwrite() {
    try {
        client = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID);
        
        databases = new Databases(client);
        console.log('Appwrite клиент инициализирован');
        return true;
    } catch (error) {
        console.error('Ошибка инициализации Appwrite:', error);
        return false;
    }
}

// Проверка подключения к Appwrite
async function testAppwriteConnection() {
    try {
        const response = await databases.list();
        console.log('Подключение к Appwrite успешно');
        return true;
    } catch (error) {
        console.error('Ошибка подключения к Appwrite:', error);
        return false;
    }
} 