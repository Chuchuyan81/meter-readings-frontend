document.addEventListener('DOMContentLoaded', function () {
    const citySelect = document.getElementById('citySelect');
    const meterTableBody = document.getElementById('meterTableBody');
    const totalAmountDiv = document.getElementById('totalAmount');
    const saveButton = document.getElementById('saveButton');
    const meterTable = document.querySelector('.meter-table');
    const meterTableHead = meterTable.querySelector('thead');
    let metersData = [];
    let selectedCityId = null;

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
    try {
        if (!initAppwrite()) {
            console.error('Ошибка инициализации Appwrite');
            alert('Ошибка инициализации Appwrite. Проверьте консоль для деталей.');
            return;
        }
        console.log('Appwrite инициализирован успешно');
    } catch (error) {
        console.error('Критическая ошибка инициализации Appwrite:', error);
        alert(`Критическая ошибка инициализации Appwrite: ${error.message}`);
        return;
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

                // Добавляем города в список
                response.documents.forEach(city => {
                    const option = document.createElement('option');
                    option.value = city.$id;
                    option.textContent = city.name;
                    citySelect.appendChild(option);
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
            alert(`Ошибка загрузки городов: ${error.message}`);
        }
    }

    // Функция для получения списка счетчиков по городу из Appwrite
    async function fetchMeters(cityId) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                METERS_COLLECTION_ID,
                [
                    Query.equal('city_id', cityId)
                ]
            );
            
            if (response.documents && response.documents.length > 0) {
                // Получаем типы счетчиков для отображения названий
                const meterTypesResponse = await databases.listDocuments(
                    DATABASE_ID,
                    METER_TYPES_COLLECTION_ID
                );
                
                const meterTypes = {};
                meterTypesResponse.documents.forEach(type => {
                    meterTypes[type.$id] = type.name;
                });

                // Получаем текущие тарифы
                const tariffsResponse = await databases.listDocuments(
                    DATABASE_ID,
                    TARIFFS_COLLECTION_ID,
                    [
                        Query.equal('city_id', cityId),
                        Query.equal('end_date', '')
                    ]
                );

                const tariffs = {};
                tariffsResponse.documents.forEach(tariff => {
                    tariffs[tariff.tariff_type_id] = tariff.tariff;
                });

                // Формируем данные счетчиков
                const meters = response.documents.map(meter => ({
                    meter_id: meter.$id,
                    meter_type: meterTypes[meter.meter_type_id] || 'Неизвестно',
                    prev_date: meter.prev_date,
                    prev_reading: meter.prev_reading,
                    current_tariff: tariffs[meter.meter_type_id] || 0
                }));

                metersData = meters;
                renderMeterTable(meters);
            } else {
                console.error('Счетчики не найдены');
                alert('Счетчики не найдены');
            }
        } catch (error) {
            console.error('Ошибка загрузки счетчиков:', error);
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
        meterTableBody.innerHTML = '';
        const currentDate = new Date().toLocaleDateString('ru-RU');
        
        meters.forEach(meter => {
            const row = document.createElement('tr');

            // Определяем класс для ячейки с типом ресурса
            let cellClass = '';
            const meterType = meter.meter_type.toLowerCase();
            if (meterType.includes('электричество')) {
                cellClass = 'electricity';
            } else if (meterType.includes('горячая')) {
                cellClass = 'hot-water';
            } else if (meterType.includes('холодная')) {
                cellClass = 'cold-water';
            }

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
                alert('Ошибка сохранения показаний');
            }
        } else {
            alert('Нет данных для сохранения');
        }
    });

    // Загружаем города при загрузке страницы
    fetchCities();
}); 