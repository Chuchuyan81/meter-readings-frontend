document.addEventListener('DOMContentLoaded', function () {
    const citySelect = document.getElementById('citySelect');
    const meterTableBody = document.getElementById('meterTableBody');
    const totalAmountDiv = document.getElementById('totalAmount');
    const saveButton = document.getElementById('saveButton');
    const meterTable = document.querySelector('.meter-table');
    const meterTableHead = meterTable.querySelector('thead');
    let metersData = [];
    let selectedCityId = null;
    let citiesMap = {}; // Карта соответствия ID городов и их упрощенных значений
    let meterTypesMap = {}; // Карта соответствия простых ID типов счетчиков и полных Appwrite ID

    // Проверяем, что Appwrite SDK загружен
    if (typeof Appwrite === 'undefined') {
        alert('Ошибка загрузки Appwrite SDK');
        return;
    }

    // Импортируем необходимые классы из Appwrite
    const { Query, ID } = Appwrite;

    // Проверяем доступность констант
    console.log('Проверка констант:');
    console.log('DATABASE_ID:', DATABASE_ID);
    console.log('CITIES_COLLECTION_ID:', CITIES_COLLECTION_ID);
    console.log('METER_TYPES_COLLECTION_ID:', METER_TYPES_COLLECTION_ID);
    console.log('METERS_COLLECTION_ID:', METERS_COLLECTION_ID);
    console.log('TARIFFS_COLLECTION_ID:', TARIFFS_COLLECTION_ID);
    console.log('METER_READINGS_COLLECTION_ID:', METER_READINGS_COLLECTION_ID);

    // Инициализация Appwrite
    async function initializeAppwrite() {
        try {
            if (!initAppwrite()) {
                console.error('Ошибка инициализации Appwrite');
                alert('Ошибка инициализации Appwrite. Проверьте консоль для деталей.');
                return false;
            }
            console.log('Appwrite инициализирован успешно');
            
            // Проверяем существующую сессию или создаем новую
            let authResult = await checkExistingSession();
            
            if (!authResult) {
                console.log('Создаем новую анонимную сессию...');
                authResult = await createAnonymousSession();
                if (!authResult) {
                    console.error('Не удалось создать анонимную сессию');
                    alert('Ошибка авторизации. Проверьте консоль для деталей.');
                    return false;
                }
            } else {
                console.log('Используем существующую сессию');
            }
            
            console.log('Авторизация выполнена успешно');
            return true;
        } catch (error) {
            console.error('Критическая ошибка инициализации Appwrite:', error);
            alert(`Критическая ошибка инициализации Appwrite: ${error.message}`);
            return false;
        }
    }

    // Функция для получения списка городов из Appwrite
    async function fetchCities() {
        try {
            console.log('Загрузка городов...');
            console.log('DATABASE_ID:', DATABASE_ID);
            console.log('CITIES_COLLECTION_ID:', CITIES_COLLECTION_ID);
            
            const response = await databases.listDocuments(
                DATABASE_ID,
                CITIES_COLLECTION_ID
            );
            
            console.log('Ответ от Appwrite:', response);
            
            if (response.documents && response.documents.length > 0) {
                // Очищаем список перед добавлением новых опций
                citySelect.innerHTML = '';

                // Добавляем опцию по умолчанию
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Выберите город';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                citySelect.appendChild(defaultOption);

                // Добавляем города в список и создаем карту соответствия
                response.documents.forEach((city, index) => {
                    const option = document.createElement('option');
                    option.value = city.$id;
                    option.textContent = city.name;
                    citySelect.appendChild(option);
                    
                    // Создаем упрощенный ID на основе индекса (1, 2, 3...)
                    const simpleCityId = String(index + 1);
                    citiesMap[city.$id] = simpleCityId;
                    
                    console.log('Добавлен город:', { 
                        id: city.$id, 
                        name: city.name, 
                        simple_id: simpleCityId 
                    });
                });
                
                console.log('Карта соответствия городов:', citiesMap);
                console.log('Все ID городов:', response.documents.map(city => city.$id));
                console.log('Детали городов:');
                response.documents.forEach((city, index) => {
                    console.log(`Город ${index + 1}:`, {
                        id: city.$id,
                        name: city.name,
                        simple_id: String(index + 1),
                        // Проверяем, есть ли другие поля
                        all_fields: city
                    });
                });
                
                console.log(`Загружено городов: ${response.documents.length}`);
            } else {
                console.error('Города не найдены');
                alert('Города не найдены в базе данных');
            }
        } catch (error) {
            console.error('Ошибка загрузки городов:', error);
            console.error('Детали ошибки:', {
                message: error.message,
                code: error.code,
                response: error.response
            });
            
            // Проверяем, является ли ошибка связанной с авторизацией
            if (error.code === 401) {
                console.log('Попытка повторной авторизации...');
                const authResult = await createAnonymousSession();
                if (authResult) {
                    console.log('Повторная авторизация успешна, повторяем запрос...');
                    await fetchCities(); // Рекурсивный вызов
                    return;
                }
            }
            
            alert(`Ошибка загрузки городов: ${error.message}`);
        }
    }

    // Функция для получения списка счетчиков по городу из Appwrite
    async function fetchMeters(cityId) {
        try {
            console.log('Загрузка счетчиков для города ID:', cityId);
            console.log('DATABASE_ID:', DATABASE_ID);
            console.log('METERS_COLLECTION_ID:', METERS_COLLECTION_ID);
            
            // Получаем упрощенный ID города для поиска в счетчиках
            const simpleCityId = citiesMap[cityId];
            console.log('Упрощенный ID города для поиска:', simpleCityId);
            
            const response = await databases.listDocuments(
                DATABASE_ID,
                METERS_COLLECTION_ID,
                [
                    Query.equal('city_id', simpleCityId)
                ]
            );
            
            console.log('Ответ от Appwrite для счетчиков:', response);
            console.log('Количество найденных счетчиков:', response.documents ? response.documents.length : 0);
            
            if (response.documents && response.documents.length > 0) {
                console.log('Данные счетчиков:', response.documents);
                
                // Получаем типы счетчиков для отображения названий
                console.log('Загрузка типов счетчиков...');
                const meterTypesResponse = await databases.listDocuments(
                    DATABASE_ID,
                    METER_TYPES_COLLECTION_ID
                );
                
                console.log('Типы счетчиков:', meterTypesResponse.documents);
                console.log('Количество типов счетчиков:', meterTypesResponse.documents ? meterTypesResponse.documents.length : 0);
                
                const meterTypes = {};
                meterTypesResponse.documents.forEach((type, index) => {
                    const simpleTypeId = String(index + 1); // Создаем простой ID (1, 2, 3...)
                    meterTypes[simpleTypeId] = type.name; // Используем простой ID как ключ
                    meterTypesMap[simpleTypeId] = type.$id; // Сохраняем соответствие
                    
                    console.log(`Тип счетчика: Простой ID=${simpleTypeId}, Appwrite ID=${type.$id}, Название=${type.name}`);
                });
                
                console.log('Карта типов счетчиков (по простым ID):', meterTypes);
                console.log('Карта соответствия типов счетчиков:', meterTypesMap);

                // Получаем текущие тарифы
                console.log('Загрузка тарифов для города:', cityId);
                console.log('Упрощенный ID для тарифов:', simpleCityId);
                const tariffsResponse = await databases.listDocuments(
                    DATABASE_ID,
                    TARIFFS_COLLECTION_ID,
                    [
                        Query.equal('city_id', simpleCityId),
                        Query.equal('end_date', '')
                    ]
                );

                console.log('Тарифы:', tariffsResponse.documents);

                const tariffs = {};
                tariffsResponse.documents.forEach(tariff => {
                    // Используем простой ID типа счетчика для тарифов
                    const simpleTypeId = String(tariff.tariff_type_id);
                    tariffs[simpleTypeId] = tariff.tariff;
                    console.log(`Тариф: тип=${simpleTypeId}, значение=${tariff.tariff}`);
                });
                
                console.log('Карта тарифов:', tariffs);

                // Формируем данные счетчиков
                const allMeters = response.documents.map(meter => {
                    const meterType = meterTypes[meter.meter_type_id] || 'Неизвестно';
                    console.log(`Обработка счетчика: ID=${meter.$id}, meter_type_id=${meter.meter_type_id}, найденный тип=${meterType}, дата=${meter.prev_date}`);
                    
                    return {
                        meter_id: meter.$id,
                        meter_type: meterType,
                        meter_type_id: meter.meter_type_id,
                        prev_date: meter.prev_date,
                        prev_reading: meter.prev_reading,
                        current_tariff: tariffs[meter.meter_type_id] || 0
                    };
                });

                console.log('Все счетчики:', allMeters);

                // Группируем счетчики по типу и выбираем последние данные
                const metersByType = {};
                allMeters.forEach(meter => {
                    const typeId = meter.meter_type_id;
                    if (!metersByType[typeId]) {
                        metersByType[typeId] = [];
                    }
                    metersByType[typeId].push(meter);
                });

                console.log('Счетчики сгруппированы по типам:', metersByType);

                // Выбираем последние данные для каждого типа
                const latestMeters = [];
                Object.keys(metersByType).forEach(typeId => {
                    const metersOfType = metersByType[typeId];
                    
                    // Сортируем по дате (от новых к старым)
                    metersOfType.sort((a, b) => new Date(b.prev_date) - new Date(a.prev_date));
                    
                    // Берем самый свежий счетчик
                    const latestMeter = metersOfType[0];
                    latestMeters.push(latestMeter);
                    
                    console.log(`Тип ${typeId}: выбран счетчик с датой ${latestMeter.prev_date} из ${metersOfType.length} доступных`);
                });

                console.log('Последние данные счетчиков:', latestMeters);

                metersData = latestMeters;
                renderMeterTable(latestMeters);
            } else {
                console.error('Счетчики не найдены для города ID:', cityId);
                console.log('Попробуем загрузить все счетчики без фильтра...');
                
                // Попробуем загрузить все счетчики без фильтра
                const allMetersResponse = await databases.listDocuments(
                    DATABASE_ID,
                    METERS_COLLECTION_ID
                );
                
                console.log('Все счетчики в базе:', allMetersResponse.documents);
                console.log('Проверяем city_id в счетчиках:');
                allMetersResponse.documents.forEach((meter, index) => {
                    console.log(`Счетчик ${index + 1}:`, {
                        id: meter.$id,
                        city_id: meter.city_id,
                        meter_type_id: meter.meter_type_id,
                        prev_date: meter.prev_date,
                        prev_reading: meter.prev_reading
                    });
                });
                
                alert('Счетчики не найдены для выбранного города');
            }
        } catch (error) {
            console.error('Ошибка загрузки счетчиков:', error);
            console.error('Детали ошибки:', {
                message: error.message,
                code: error.code,
                response: error.response
            });
            
            // Проверяем, является ли ошибка связанной с авторизацией
            if (error.code === 401) {
                console.log('Попытка повторной авторизации для счетчиков...');
                const authResult = await createAnonymousSession();
                if (authResult) {
                    console.log('Повторная авторизация успешна, повторяем запрос счетчиков...');
                    await fetchMeters(cityId); // Рекурсивный вызов
                    return;
                }
            }
            
            alert('Ошибка загрузки счетчиков');
        }
    }

    // Функция для форматирования даты в формат дд.мм.гггг
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    // Функция для вывода счетчиков в таблицу
    function renderMeterTable(meters) {
        console.log('Рендеринг таблицы счетчиков:', meters);
        meterTableBody.innerHTML = '';
        const currentDate = new Date().toLocaleDateString('ru-RU');
        
        meters.forEach((meter, index) => {
            console.log(`Рендеринг счетчика ${index + 1}:`, meter);
            
            const row = document.createElement('tr');

            // Определяем класс для ячейки с типом ресурса
            let cellClass = '';
            const meterType = meter.meter_type.toLowerCase();
            console.log(`Тип счетчика для стилизации: "${meterType}"`);
            
            if (meterType.includes('электричество')) {
                cellClass = 'electricity';
            } else if (meterType.includes('горячая')) {
                cellClass = 'hot-water';
            } else if (meterType.includes('холодная')) {
                cellClass = 'cold-water';
            }
            
            console.log(`Выбранный CSS класс: "${cellClass}"`);

            row.innerHTML = `
                <td class="resource-type ${cellClass}">${meter.meter_type}</td>
                <td>${formatDate(meter.prev_date)}</td>
                <td>${meter.prev_reading}</td>
                <td>${currentDate}</td>
                <td><input type="number" class="currentReading" data-meter-id="${meter.meter_id}" style="-moz-appearance: textfield;"></td>
                <td class="consumption">0</td>
                <td class="amount" data-tariff="${meter.current_tariff || 0}">0</td>
            `;
            meterTableBody.appendChild(row);
        });
        
        console.log('Таблица отрендерена, количество строк:', meterTableBody.children.length);
    }

    // Функция для изменения цвета шапки таблицы в зависимости от города
    function updateTableHeaderColor(cityId) {
        meterTableHead.classList.remove('city-1', 'city-2', 'city-3');
        
        if (cityId === '1') {
            meterTableHead.classList.add('city-1');
        } else if (cityId === '2') {
            meterTableHead.classList.add('city-2');
        } else if (cityId === '3') {
            meterTableHead.classList.add('city-3');
        }
    }

    // Обработчик события для выпадающего списка выбора города
    citySelect.addEventListener('change', function () {
        selectedCityId = citySelect.value;
        if (selectedCityId) {
            fetchMeters(selectedCityId);
            updateTableHeaderColor(selectedCityId);
        }
    });

    // Обработчик для поля показаний (расчет при потере фокуса)
    meterTableBody.addEventListener('focusout', function (event) {
        if (event.target.classList.contains('currentReading')) {
            const currentReadingInput = event.target;
            const meterId = currentReadingInput.dataset.meterId;
            const currentRow = currentReadingInput.closest('tr');
            const consumptionCell = currentRow.querySelector('.consumption');
            const amountCell = currentRow.querySelector('.amount');
            const prevReadingCell = currentRow.querySelector('td:nth-child(3)');
            const currentReading = parseFloat(currentReadingInput.value);
            const prevReading = parseFloat(prevReadingCell.textContent);
            const tariff = parseFloat(amountCell.dataset.tariff);
            
            if (!isNaN(currentReading) && !isNaN(prevReading)) {
                const consumption = (currentReading - prevReading).toFixed(2);
                const amount = (consumption * tariff).toFixed(2);
                consumptionCell.textContent = consumption;
                amountCell.textContent = amount;
            } else {
                consumptionCell.textContent = 0;
                amountCell.textContent = 0;
            }
        }
    });

    // Обработчик для кнопки "Рассчитать"
    const calculateButton = document.getElementById('calculateButton');
    calculateButton.addEventListener('click', function () {
        let totalAmount = 0;
        const amountCells = meterTableBody.querySelectorAll('.amount');
        amountCells.forEach(amountCell => {
            totalAmount += parseFloat(amountCell.textContent || 0);
        });
        totalAmountDiv.textContent = `По счетчикам: ${totalAmount.toFixed(2)}`;
    });

    // Обработчик для кнопки "Сохранить"
    saveButton.addEventListener('click', async function () {
        const readingsToSave = [];
        meterTableBody.querySelectorAll('tr').forEach(row => {
            const currentReadingInput = row.querySelector('.currentReading');
            if (currentReadingInput && currentReadingInput.value !== '') {
                const meterId = currentReadingInput.dataset.meterId;
                const reading = parseFloat(currentReadingInput.value);
                readingsToSave.push({
                    meterId: meterId,
                    reading: reading
                });
            }
        });

        if (readingsToSave.length > 0) {
            try {
                // Сохраняем показания в Appwrite
                for (const reading of readingsToSave) {
                    await databases.createDocument(
                        DATABASE_ID,
                        METER_READINGS_COLLECTION_ID,
                        ID.unique(),
                        {
                            meter_id: reading.meterId,
                            reading_date: new Date().toISOString().split('T')[0],
                            reading: reading.reading,
                            created_at: new Date().toISOString()
                        }
                    );
                }

                alert('Показания успешно сохранены!');
                
                // Обновляем данные счетчиков
                if (selectedCityId) {
                    await fetchMeters(selectedCityId);
                }
            } catch (error) {
                console.error('Ошибка сохранения показаний:', error);
                
                // Проверяем, является ли ошибка связанной с авторизацией
                if (error.code === 401) {
                    console.log('Попытка повторной авторизации для сохранения...');
                    const authResult = await createAnonymousSession();
                    if (authResult) {
                        console.log('Повторная авторизация успешна, повторяем сохранение...');
                        // Повторяем сохранение
                        saveButton.click();
                        return;
                    }
                }
                
                alert('Ошибка сохранения показаний');
            }
        } else {
            alert('Нет данных для сохранения');
        }
    });

    // Обработчик для кнопки "Распечатать справку"
    const printButton = document.getElementById('printButton');
    printButton.addEventListener('click', function() {
        console.log('Нажата кнопка "Распечатать справку"');
        
        // Получаем данные о выбранном городе
        const selectedCity = citySelect.value;
        const cityName = citySelect.options[citySelect.selectedIndex]?.text || 'Неизвестный город';
        
        console.log('Выбранный город:', cityName);
        
        // Проверяем ограничение: печать доступна только для адреса "Котовского 45"
        if (!cityName.includes('Котовского 45')) {
            alert('Печать справки доступна только для адреса "Котовского 45"');
            return;
        }
        
        // Получаем данные из таблицы
        const rows = meterTableBody.querySelectorAll('tr');
        let coldWaterData = null;
        let hotWaterData = null;
        
        rows.forEach((row, index) => {
            const resourceType = row.querySelector('td:first-child').textContent.trim().toLowerCase();
            const prevReading = parseFloat(row.querySelector('td:nth-child(3)').textContent.replace(',', '.'));
            const currentReadingInput = row.querySelector('input[type="number"]');
            const currentReading = currentReadingInput ? parseFloat(currentReadingInput.value.replace(',', '.')) : 0;
            
            console.log(`Обработка счетчика ${index + 1}:`, {
                type: resourceType,
                prevReading: prevReading,
                currentReading: currentReading
            });
            
            // Проверяем, что оба значения — числа и есть показания
            if (!isNaN(prevReading) && !isNaN(currentReading) && currentReading > 0) {
                const consumption = currentReading - prevReading;
                
                if (resourceType.includes('холодная')) {
                    coldWaterData = { 
                        prev: prevReading, 
                        current: currentReading, 
                        total: consumption 
                    };
                    console.log('Данные холодной воды:', coldWaterData);
                } else if (resourceType.includes('горячая')) {
                    hotWaterData = { 
                        prev: prevReading, 
                        current: currentReading, 
                        total: consumption 
                    };
                    console.log('Данные горячей воды:', hotWaterData);
                }
            }
        });
        
        // Проверяем, есть ли данные для печати
        if (!coldWaterData && !hotWaterData) {
            alert('Нет данных холодной или горячей воды для печати. Введите показания в таблицу.');
            return;
        }
        
        // Получаем текущую дату
        const date = new Date();
        const month = date.toLocaleString('ru', { month: 'long' });
        const year = date.getFullYear();
        
        // Формируем URL с параметрами
        const params = new URLSearchParams({
            apartment: '73', // Фиксированный номер квартиры
            month: month,
            year: year,
            coldPrev: coldWaterData ? coldWaterData.prev : '',
            coldCurrent: coldWaterData ? coldWaterData.current : '',
            coldTotal: coldWaterData ? coldWaterData.total.toFixed(2) : '',
            hotPrev: hotWaterData ? hotWaterData.prev : '',
            hotCurrent: hotWaterData ? hotWaterData.current : '',
            hotTotal: hotWaterData ? hotWaterData.total.toFixed(2) : ''
        });
        
        console.log('Параметры для печати:', params.toString());
        
        // Открываем страницу печати в новом окне
        window.open(`print.html?${params.toString()}`, '_blank');
    });

    // Инициализируем Appwrite и загружаем города
    initializeAppwrite().then(success => {
        if (success) {
            fetchCities();
        }
    });
}); 