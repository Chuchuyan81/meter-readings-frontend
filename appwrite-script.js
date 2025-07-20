// Инициализация Appwrite
const { Client, Databases, Query, ID } = Appwrite;

const client = new Client();
const databases = new Databases(client);

// Настройка клиента
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

document.addEventListener('DOMContentLoaded', function () {
    const citySelect = document.getElementById('citySelect');
    const meterTableBody = document.getElementById('meterTableBody');
    const totalAmountDiv = document.getElementById('totalAmount');
    const saveButton = document.getElementById('saveButton');
    const meterTable = document.querySelector('.meter-table');
    const meterTableHead = meterTable.querySelector('thead');
    let metersData = [];
    let selectedCityId = null;

    // Функция для получения списка городов
    async function fetchCities() {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.cities
            );
            
            const cities = response.documents;
            
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
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.$id;
                option.textContent = city.name;
                citySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Ошибка загрузки городов:', error);
            alert('Ошибка загрузки городов');
        }
    }

    // Функция для получения типов счетчиков
    async function fetchMeterTypes() {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.meterTypes
            );
            return response.documents;
        } catch (error) {
            console.error('Ошибка загрузки типов счетчиков:', error);
            return [];
        }
    }

    // Функция для получения счетчиков по городу
    async function fetchMeters(cityId) {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.meters,
                [Appwrite.Query.equal('city_id', cityId)]
            );
            
            const meters = response.documents;
            const meterTypes = await fetchMeterTypes();
            
            // Группируем счетчики по типам (берем последний для каждого типа)
            const metersByType = {};
            
            for (const meter of meters) {
                const meterType = meterTypes.find(type => type.$id === meter.meter_type_id);
                if (meterType) {
                    const typeName = meterType.name;
                    if (!metersByType[typeName] || 
                        new Date(meter.prev_date) > new Date(metersByType[typeName].prev_date)) {
                        metersByType[typeName] = {
                            meter_type: typeName,
                            prev_date: meter.prev_date,
                            prev_reading: meter.prev_reading,
                            meter_id: meter.$id,
                            city_id: meter.city_id,
                            meter_type_id: meter.meter_type_id
                        };
                    }
                }
            }
            
            // Получаем тарифы для каждого счетчика
            const metersWithTariffs = await Promise.all(
                Object.values(metersByType).map(async (meter) => {
                    const tariff = await fetchCurrentTariff(meter.meter_id, meter.city_id, meter.meter_type_id);
                    return {
                        ...meter,
                        current_tariff: tariff ? tariff.tariff : 0
                    };
                })
            );
            
            metersData = metersWithTariffs;
            renderMeterTable(metersWithTariffs);
        } catch (error) {
            console.error('Ошибка загрузки счетчиков:', error);
            alert('Ошибка загрузки счетчиков');
        }
    }

    // Функция для получения текущего тарифа
    async function fetchCurrentTariff(meterId, cityId, meterTypeId) {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tariffs,
                [
                    Appwrite.Query.equal('city_id', cityId),
                    Appwrite.Query.equal('meter_type_id', meterTypeId),
                    Appwrite.Query.isNull('end_date')
                ]
            );
            
            return response.documents.length > 0 ? response.documents[0] : null;
        } catch (error) {
            console.error('Ошибка загрузки тарифа:', error);
            return null;
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
            if (meter.meter_type === 'электричество') {
                cellClass = 'electricity';
            } else if (meter.meter_type === 'горячая вода') {
                cellClass = 'hot-water';
            } else if (meter.meter_type === 'холодная вода') {
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
        // Удаляем все классы, связанные с цветом шапки
        meterTableHead.classList.remove('city-1', 'city-2', 'city-3');

        // Добавляем класс в зависимости от выбранного города
        // Используем хэш от cityId для определения цвета
        const cityHash = cityId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        const colorIndex = Math.abs(cityHash) % 3 + 1;
        meterTableHead.classList.add(`city-${colorIndex}`);
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
        const currentDate = new Date().toISOString();
        
        meterTableBody.querySelectorAll('tr').forEach(row => {
            const currentReadingInput = row.querySelector('.currentReading');
            if (currentReadingInput && currentReadingInput.value !== '') {
                const meterId = currentReadingInput.dataset.meterId;
                const reading = parseFloat(currentReadingInput.value);
                readingsToSave.push({
                    meter_id: meterId,
                    reading: reading,
                    reading_date: currentDate
                });
            }
        });

        if (readingsToSave.length > 0) {
            try {
                // Сохраняем показания
                const promises = readingsToSave.map(async (reading) => {
                    // Создаем запись показаний
                    await databases.createDocument(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.collections.meterReadings,
                        Appwrite.ID.unique(),
                        reading
                    );
                    
                    // Обновляем предыдущие показания счетчика
                    await databases.updateDocument(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.collections.meters,
                        reading.meter_id,
                        {
                            prev_date: reading.reading_date,
                            prev_reading: reading.reading
                        }
                    );
                });
                
                await Promise.all(promises);
                alert('Показания успешно сохранены!');
                
                // Перезагружаем данные
                if (selectedCityId) {
                    fetchMeters(selectedCityId);
                }
            } catch (error) {
                console.error('Ошибка сохранения показаний:', error);
                alert('Ошибка сохранения показаний');
            }
        } else {
            alert('Нет данных для сохранения');
        }
    });

    // Обработчик для кнопки "Распечатать справку"
    const printButton = document.getElementById('printButton');
    printButton.addEventListener('click', function () {
        // Создаем данные для печати
        const printData = {
            city: citySelect.options[citySelect.selectedIndex].text,
            date: new Date().toLocaleDateString('ru-RU'),
            readings: []
        };
        
        meterTableBody.querySelectorAll('tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            const currentReadingInput = row.querySelector('.currentReading');
            
            if (currentReadingInput && currentReadingInput.value !== '') {
                printData.readings.push({
                    type: cells[0].textContent,
                    prevDate: cells[1].textContent,
                    prevReading: cells[2].textContent,
                    currentReading: currentReadingInput.value,
                    consumption: cells[5].textContent,
                    amount: cells[6].textContent
                });
            }
        });
        
        // Сохраняем данные в localStorage для страницы печати
        localStorage.setItem('printData', JSON.stringify(printData));
        
        // Открываем страницу печати
        window.open('print.html', '_blank');
    });

    // Инициализация приложения
    fetchCities();
}); 