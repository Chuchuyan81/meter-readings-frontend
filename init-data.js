// Скрипт для инициализации данных в Appwrite
// Запустите этот скрипт после настройки коллекций

// Инициализация Appwrite
const { Client, Databases, ID } = Appwrite;

const client = new Client();
const databases = new Databases(client);

// Настройка клиента
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

// Начальные данные
const INITIAL_DATA = {
    cities: [
        { name: 'Москва' },
        { name: 'СПб, Кузнецова 45' },
        { name: 'Тула' }
    ],
    meterTypes: [
        { name: 'электричество' },
        { name: 'горячая вода' },
        { name: 'холодная вода' }
    ]
};

// Функция для создания городов
async function createCities() {
    console.log('Создание городов...');
    const createdCities = [];
    
    for (const city of INITIAL_DATA.cities) {
        try {
            const response = await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.cities,
                Appwrite.ID.unique(),
                city
            );
            createdCities.push(response);
            console.log(`✓ Город создан: ${city.name}`);
        } catch (error) {
            console.error(`✗ Ошибка создания города ${city.name}:`, error);
        }
    }
    
    return createdCities;
}

// Функция для создания типов счетчиков
async function createMeterTypes() {
    console.log('Создание типов счетчиков...');
    const createdTypes = [];
    
    for (const meterType of INITIAL_DATA.meterTypes) {
        try {
            const response = await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.meterTypes,
                Appwrite.ID.unique(),
                meterType
            );
            createdTypes.push(response);
            console.log(`✓ Тип счетчика создан: ${meterType.name}`);
        } catch (error) {
            console.error(`✗ Ошибка создания типа счетчика ${meterType.name}:`, error);
        }
    }
    
    return createdTypes;
}

// Функция для создания примеров счетчиков
async function createSampleMeters(cities, meterTypes) {
    console.log('Создание примеров счетчиков...');
    
    const currentDate = new Date().toISOString();
    
    for (const city of cities) {
        for (const meterType of meterTypes) {
            try {
                const meterData = {
                    city_id: city.$id,
                    meter_type_id: meterType.$id,
                    prev_date: currentDate,
                    prev_reading: 0
                };
                
                const response = await databases.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.meters,
                    Appwrite.ID.unique(),
                    meterData
                );
                
                console.log(`✓ Счетчик создан: ${city.name} - ${meterType.name}`);
            } catch (error) {
                console.error(`✗ Ошибка создания счетчика ${city.name} - ${meterType.name}:`, error);
            }
        }
    }
}

// Функция для создания примеров тарифов
async function createSampleTariffs(cities, meterTypes) {
    console.log('Создание примеров тарифов...');
    
    const currentDate = new Date().toISOString();
    
    // Примеры тарифов
    const tariffRates = {
        'электричество': 5.47,
        'горячая вода': 185.50,
        'холодная вода': 42.30
    };
    
    for (const city of cities) {
        for (const meterType of meterTypes) {
            try {
                const tariffData = {
                    city_id: city.$id,
                    meter_type_id: meterType.$id,
                    tariff: tariffRates[meterType.name] || 1.0,
                    start_date: currentDate,
                    end_date: null
                };
                
                const response = await databases.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.tariffs,
                    Appwrite.ID.unique(),
                    tariffData
                );
                
                console.log(`✓ Тариф создан: ${city.name} - ${meterType.name} - ${tariffData.tariff}`);
            } catch (error) {
                console.error(`✗ Ошибка создания тарифа ${city.name} - ${meterType.name}:`, error);
            }
        }
    }
}

// Функция для проверки существования данных
async function checkExistingData() {
    try {
        const citiesResponse = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.cities
        );
        
        const meterTypesResponse = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.meterTypes
        );
        
        return {
            cities: citiesResponse.documents.length,
            meterTypes: meterTypesResponse.documents.length
        };
    } catch (error) {
        console.error('Ошибка проверки существующих данных:', error);
        return { cities: 0, meterTypes: 0 };
    }
}

// Основная функция инициализации
async function initializeData() {
    console.log('🚀 Начинаем инициализацию данных...');
    
    try {
        // Проверяем существующие данные
        const existing = await checkExistingData();
        console.log(`Найдено городов: ${existing.cities}, типов счетчиков: ${existing.meterTypes}`);
        
        let cities = [];
        let meterTypes = [];
        
        // Создаем города, если их нет
        if (existing.cities === 0) {
            cities = await createCities();
        } else {
            console.log('Города уже существуют, пропускаем создание');
            const citiesResponse = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.cities
            );
            cities = citiesResponse.documents;
        }
        
        // Создаем типы счетчиков, если их нет
        if (existing.meterTypes === 0) {
            meterTypes = await createMeterTypes();
        } else {
            console.log('Типы счетчиков уже существуют, пропускаем создание');
            const meterTypesResponse = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.meterTypes
            );
            meterTypes = meterTypesResponse.documents;
        }
        
        // Создаем примеры счетчиков и тарифов
        await createSampleMeters(cities, meterTypes);
        await createSampleTariffs(cities, meterTypes);
        
        console.log('✅ Инициализация данных завершена успешно!');
        
        // Показываем сводку
        console.log('\n📊 Сводка созданных данных:');
        console.log(`Городов: ${cities.length}`);
        console.log(`Типов счетчиков: ${meterTypes.length}`);
        console.log(`Счетчиков: ${cities.length * meterTypes.length}`);
        console.log(`Тарифов: ${cities.length * meterTypes.length}`);
        
    } catch (error) {
        console.error('❌ Ошибка инициализации данных:', error);
    }
}

// Функция для очистки данных (для разработки)
async function clearAllData() {
    console.log('🧹 Очистка всех данных...');
    
    const collections = [
        APPWRITE_CONFIG.collections.meterReadings,
        APPWRITE_CONFIG.collections.tariffs,
        APPWRITE_CONFIG.collections.meters,
        APPWRITE_CONFIG.collections.meterTypes,
        APPWRITE_CONFIG.collections.cities
    ];
    
    for (const collectionId of collections) {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                collectionId
            );
            
            for (const document of response.documents) {
                await databases.deleteDocument(
                    APPWRITE_CONFIG.databaseId,
                    collectionId,
                    document.$id
                );
            }
            
            console.log(`✓ Очищена коллекция: ${collectionId}`);
        } catch (error) {
            console.error(`✗ Ошибка очистки коллекции ${collectionId}:`, error);
        }
    }
    
    console.log('✅ Очистка данных завершена!');
}

// Экспорт функций для использования в консоли браузера
window.initializeData = initializeData;
window.clearAllData = clearAllData;

// Автоматический запуск при загрузке страницы (закомментировано для безопасности)
// document.addEventListener('DOMContentLoaded', initializeData);

console.log('🔧 Скрипт инициализации данных загружен!');
console.log('Для запуска выполните: initializeData()');
console.log('Для очистки данных выполните: clearAllData()'); 