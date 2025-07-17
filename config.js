// Конфигурация Appwrite
const APPWRITE_CONFIG = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: 'YOUR_PROJECT_ID', // Замените на ваш Project ID
    databaseId: 'meters_db',
    collections: {
        cities: 'cities',
        meterTypes: 'meter_types',
        meters: 'meters',
        meterReadings: 'meter_readings',
        tariffs: 'tariffs'
    }
};

// Экспорт конфигурации
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APPWRITE_CONFIG;
} 