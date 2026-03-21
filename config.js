// Конфигурация Appwrite (клиентский SDK: endpoint + projectId; серверный API-ключ не храните здесь)
const APPWRITE_CONFIG = {
    endpoint: 'https://fra.cloud.appwrite.io/v1', // Ваш endpoint
    projectId: '68790cc0001f9d5ee482', // Ваш Project ID
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