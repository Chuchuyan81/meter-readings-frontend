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

                // Получаем последние показания из коллекции meter_readings
                console.log('=== НАЧАЛО ЗАГРУЗКИ ПОКАЗАНИЙ ===');
                console.log('Загрузка последних показаний из meter_readings...');
                
                // Получаем все показания
                console.log('Запрос показаний из базы данных...');
                let readings = [];
                try {
                    const resp = await databases.listDocuments(
                        DATABASE_ID,
                        METER_READINGS_COLLECTION_ID
                    );
                    const docs = resp.documents || [];
                    console.log('Показания получены, количество:', docs.length);
                    
                    if (docs.length === 0) {
                        console.log('⚠️ Показания не найдены, используем данные из meters');
                        // Если показаний нет, используем данные из meters
                        const allMeters = response.documents.map(meter => {
                            const meterType = meterTypes[meter.meter_type_id] || 'Неизвестно';
                            return {
                                meter_id: meter.$id,
                                meter_type: meterType,
                                meter_type_id: meter.meter_type_id,
                                prev_date: meter.prev_date,
                                prev_reading: meter.prev_reading,
                                current_tariff: tariffs[meter.meter_type_id] || 0
                            };
                        });
                        
                        metersData = allMeters;
                        renderMeterTable(allMeters);
                        return;
                    }

                    readings = docs;
                } catch (error) {
                    console.error('❌ Ошибка получения показаний:', error);
                    console.log('Используем данные из meters');
                    // При ошибке используем данные из meters
                    const allMeters = response.documents.map(meter => {
                        const meterType = meterTypes[meter.meter_type_id] || 'Неизвестно';
                        return {
                            meter_id: meter.$id,
                            meter_type: meterType,
                            meter_type_id: meter.meter_type_id,
                            prev_date: meter.prev_date,
                            prev_reading: meter.prev_reading,
                            current_tariff: tariffs[meter.meter_type_id] || 0
                        };
                    });
                    
                    metersData = allMeters;
                    renderMeterTable(allMeters);
                    return;
                }
                
                // Фильтруем показания только для счетчиков выбранного города
                const cityMeterIds = response.documents.map(meter => meter.$id);
                console.log('ID счетчиков города:', cityMeterIds);
                
                const cityReadings = readings.filter(reading => 
                    cityMeterIds.includes(reading.meter_id)
                );
                
                console.log('Все показания:', readings);
                console.log('Показания для выбранного города:', cityReadings);
                
                // Детальная диагностика сопоставления
                console.log('=== ДИАГНОСТИКА СОПОСТАВЛЕНИЯ ===');
                readings.forEach(reading => {
                    const isInCity = cityMeterIds.includes(reading.meter_id);
                    console.log(`Показание ${reading.$id}: meter_id=${reading.meter_id}, дата=${reading.reading_date}, значение=${reading.reading}, в городе=${isInCity}`);
                });
                
                // Группируем показания по meter_id и находим последние
                const latestReadings = {};
                cityReadings.forEach(reading => {
                    const meterId = reading.meter_id;
                    if (!latestReadings[meterId] || new Date(reading.reading_date) > new Date(latestReadings[meterId].reading_date)) {
                        latestReadings[meterId] = reading;
                    }
                });
                
                console.log('Последние показания по счетчикам:', latestReadings);

                // Формируем данные счетчиков с последними показаниями
                console.log('=== ОБРАБОТКА СЧЕТЧИКОВ ===');
                const allMeters = response.documents.map(meter => {
                    const meterType = meterTypes[meter.meter_type_id] || 'Неизвестно';
                    const latestReading = latestReadings[meter.$id];
                    
                    console.log(`\nОбработка счетчика: ID=${meter.$id}, meter_type_id=${meter.meter_type_id}, найденный тип=${meterType}`);
                    console.log(`Данные из meters: дата=${meter.prev_date}, показание=${meter.prev_reading}`);
                    console.log(`Последнее показание для счетчика ${meter.$id}:`, latestReading);
                    
                    const prevDate = latestReading ? latestReading.reading_date : meter.prev_date;
                    const prevReading = latestReading ? latestReading.reading : meter.prev_reading;
                    
                    console.log(`Итоговые данные для счетчика ${meter.$id}: дата=${prevDate}, показание=${prevReading}`);
                    
                    return {
                        meter_id: meter.$id,
                        meter_type: meterType,
                        meter_type_id: meter.meter_type_id,
                        prev_date: prevDate,
                        prev_reading: prevReading,
                        current_tariff: tariffs[meter.meter_type_id] || 0
                    };
                });

                console.log('Все счетчики с последними показаниями:', allMeters);

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

                console.log('Последние данные счетчиков после сортировки:', latestMeters);

                console.log('Последние данные счетчиков:', latestMeters);

                metersData = latestMeters;
                console.log('Данные сохранены в metersData, вызываем renderMeterTable...');
                renderMeterTable(latestMeters);
                console.log('Таблица отрендерена с обновленными данными');
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
        console.log('Количество счетчиков для отображения:', meters.length);
        meterTableBody.innerHTML = '';
        const currentDate = new Date().toLocaleDateString('ru-RU');
        
        meters.forEach((meter, index) => {
            console.log(`Рендеринг счетчика ${index + 1}:`, {
                id: meter.meter_id,
                type: meter.meter_type,
                prev_date: meter.prev_date,
                prev_reading: meter.prev_reading,
                tariff: meter.current_tariff
            });
            
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
                <td class="resource-type ${cellClass}" data-label="Тип ресурса">${meter.meter_type}</td>
                <td data-label="Дата предыдущих показаний">${formatDate(meter.prev_date)}</td>
                <td data-label="Предыдущие показания">${meter.prev_reading}</td>
                <td data-label="Дата текущих показаний">${currentDate}</td>
                <td data-label="Текущие показания"><input type="number" class="currentReading" data-meter-id="${meter.meter_id}" style="-moz-appearance: textfield;"></td>
                <td class="consumption" data-label="Расход">0</td>
                <td class="amount" data-label="Сумма" data-tariff="${meter.current_tariff || 0}">0</td>
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
    meterTableBody.addEventListener('focusout', async function (event) {
        if (event.target.classList.contains('currentReading')) {
            const currentReadingInput = event.target;
            const meterId = currentReadingInput.dataset.meterId;
            const currentRow = currentReadingInput.closest('tr');
            const consumptionCell = currentRow.querySelector('.consumption');
            const amountCell = currentRow.querySelector('.amount');
            const prevReadingCell = currentRow.querySelector('td:nth-child(3)');
            const currentReading = parseFloat(currentReadingInput.value);
            const prevReading = parseFloat(prevReadingCell.textContent);
            
            // Получаем актуальный тариф из базы данных
            try {
                console.log('=== ОБНОВЛЕНИЕ ТАРИФА ДЛЯ РАСЧЕТА ===');
                console.log('Счетчик ID:', meterId);
                
                // Находим данные счетчика
                const meter = metersData.find(m => m.meter_id === meterId);
                if (meter) {
                    console.log('Город ID:', meter.city_id);
                    console.log('Тип счетчика ID:', meter.meter_type_id);
                    
                    // Получаем актуальный тариф
                    const currentTariff = await fetchCurrentTariff(meterId, meter.city_id, meter.meter_type_id);
                    const tariff = currentTariff ? currentTariff.tariff : 0;
                    
                    console.log('Актуальный тариф:', tariff);
                    
                    // Обновляем data-tariff в ячейке
                    amountCell.dataset.tariff = tariff;
                    
                    if (!isNaN(currentReading) && !isNaN(prevReading)) {
                        const consumption = (currentReading - prevReading).toFixed(2);
                        const amount = (consumption * tariff).toFixed(2);
                        consumptionCell.textContent = consumption;
                        amountCell.textContent = amount;
                        console.log(`Расчет: ${consumption} × ${tariff} = ${amount}`);
                    } else {
                        consumptionCell.textContent = 0;
                        amountCell.textContent = 0;
                    }
                } else {
                    console.warn('Счетчик не найден в данных:', meterId);
                    // Используем старый тариф
                    const tariff = parseFloat(amountCell.dataset.tariff) || 0;
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
            } catch (error) {
                console.error('Ошибка получения актуального тарифа:', error);
                // Используем старый тариф в случае ошибки
                const tariff = parseFloat(amountCell.dataset.tariff) || 0;
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
        }
    });

    // Обработчик для кнопки "Рассчитать"
    const calculateButton = document.getElementById('calculateButton');
    calculateButton.addEventListener('click', async function () {
        console.log('=== РАСЧЕТ ИТОГОВОЙ СУММЫ ===');
        
        try {
            // Обновляем все расчеты с актуальными тарифами
            const rows = meterTableBody.querySelectorAll('tr');
            for (const row of rows) {
                const currentReadingInput = row.querySelector('.currentReading');
                if (currentReadingInput && currentReadingInput.value !== '') {
                    // Триггерим событие focusout для пересчета с актуальными тарифами
                    currentReadingInput.dispatchEvent(new Event('focusout'));
                }
            }
            
            // Даем время на обновление расчетов
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Считаем итоговую сумму
            let totalAmount = 0;
            const amountCells = meterTableBody.querySelectorAll('.amount');
            amountCells.forEach(amountCell => {
                totalAmount += parseFloat(amountCell.textContent || 0);
            });
            
            console.log('Итоговая сумма:', totalAmount.toFixed(2));
            totalAmountDiv.textContent = `По счетчикам: ${totalAmount.toFixed(2)}`;
            
        } catch (error) {
            console.error('Ошибка расчета:', error);
            alert('Ошибка расчета: ' + error.message);
        }
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
                console.log('Начинаем сохранение показаний:', readingsToSave);
                
                // Сохраняем показания в Appwrite
                for (const reading of readingsToSave) {
                    console.log('Сохраняем показание:', reading);
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
                    console.log('Показание сохранено:', reading.meterId);
                }

                console.log('Все показания сохранены, обновляем данные счетчиков...');
                
                // Обновляем данные счетчиков в коллекции meters
                for (const reading of readingsToSave) {
                    try {
                        // Получаем текущие данные счетчика
                        const meterData = await databases.getDocument(
                            DATABASE_ID,
                            METERS_COLLECTION_ID,
                            reading.meterId
                        );
                        
                        console.log('Текущие данные счетчика:', meterData);
                        
                        // Обновляем счетчик с новыми показаниями
                        await databases.updateDocument(
                            DATABASE_ID,
                            METERS_COLLECTION_ID,
                            reading.meterId,
                            {
                                prev_date: new Date().toISOString().split('T')[0],
                                prev_reading: reading.reading
                            }
                        );
                        
                        console.log('Счетчик обновлен:', reading.meterId);
                    } catch (updateError) {
                        console.error('Ошибка обновления счетчика:', reading.meterId, updateError);
                    }
                }

                alert('Показания успешно сохранены!');
                
                // Обновляем данные счетчиков и перерисовываем таблицу
                if (selectedCityId) {
                    console.log('Перезагружаем данные для города:', selectedCityId);
                    await fetchMeters(selectedCityId);
                    
                    // Очищаем поля ввода после успешного сохранения
                    meterTableBody.querySelectorAll('.currentReading').forEach(input => {
                        input.value = '';
                    });
                    
                    // Очищаем расчеты
                    meterTableBody.querySelectorAll('.consumption').forEach(cell => {
                        cell.textContent = '0';
                    });
                    
                    meterTableBody.querySelectorAll('.amount').forEach(cell => {
                        cell.textContent = '0';
                    });
                    
                    // Очищаем итоговую сумму
                    totalAmountDiv.textContent = '';
                    
                    console.log('Таблица обновлена после сохранения');
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
                
                alert('Ошибка сохранения показаний: ' + error.message);
            }
        } else {
            alert('Нет данных для сохранения');
        }
    });

    // Обработчик для кнопки "Обновить тарифы"
    const refreshTariffsButton = document.getElementById('refreshTariffsButton');
    refreshTariffsButton.addEventListener('click', async function() {
        console.log('=== ОБНОВЛЕНИЕ ТАРИФОВ ===');
        
        if (!selectedCityId) {
            alert('Сначала выберите город');
            return;
        }
        
        try {
            refreshTariffsButton.disabled = true;
            refreshTariffsButton.textContent = '🔄 Обновление...';
            
            console.log('Обновляем тарифы для города:', selectedCityId);
            
            // Перезагружаем счетчики с актуальными тарифами
            await fetchMeters(selectedCityId);
            
            // Обновляем все расчеты в таблице
            const rows = meterTableBody.querySelectorAll('tr');
            for (const row of rows) {
                const currentReadingInput = row.querySelector('.currentReading');
                if (currentReadingInput && currentReadingInput.value !== '') {
                    // Триггерим событие focusout для пересчета
                    currentReadingInput.dispatchEvent(new Event('focusout'));
                }
            }
            
            console.log('Тарифы обновлены успешно');
            alert('Тарифы обновлены! Все расчеты пересчитаны с актуальными тарифами.');
            
        } catch (error) {
            console.error('Ошибка обновления тарифов:', error);
            alert('Ошибка обновления тарифов: ' + error.message);
        } finally {
            refreshTariffsButton.disabled = false;
            refreshTariffsButton.textContent = '🔄 Обновить тарифы';
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
    console.log('=== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ===');
    initializeAppwrite().then(success => {
        if (success) {
            console.log('✅ Appwrite инициализирован успешно, загружаем города...');
            fetchCities();
        } else {
            console.error('❌ Ошибка инициализации Appwrite');
            alert('Ошибка инициализации Appwrite. Проверьте консоль для деталей.');
        }
    }).catch(error => {
        console.error('❌ Критическая ошибка при инициализации:', error);
        alert(`Критическая ошибка: ${error.message}`);
    });
}); 