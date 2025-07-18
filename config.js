// Конфигурация Appwrite
const APPWRITE_CONFIG = {
    endpoint: 'https://fra.cloud.appwrite.io/v1', // Ваш endpoint
    projectId: '68790cc0001f9d5ee482', // Ваш Project ID
    // TODO: Добавьте ваш API Key после создания платформы в Appwrite Cloud
    apiKey: 'standard_004ffb9fe334a79a700b6458572237392550ab90d400275fde1cf51ff0ceae22babed0ca955832e01ba74369b117826367f9db559c0987fa6c64a9ca287f5ae75e4040616d36705b1d86d902da5b4348c438b08e11f344978ddb480bef8fd30a2d2ab5eed1cfee6c0580f2c861766bb807201af18cade268babd59238f2580e9', // Замените на ваш API ключ
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