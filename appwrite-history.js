// Инициализация Appwrite
const { Client, Databases, Query } = Appwrite;

const client = new Client();
const databases = new Databases(client);

// Настройка клиента
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

document.addEventListener('DOMContentLoaded', function () {
    const citySelect = document.getElementById('citySelect');
    const meterTypeSelect = document.getElementById('meterTypeSelect');
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const loadHistoryButton = document.getElementById('loadHistoryButton');
    const historyTableBody = document.getElementById('historyTableBody');
    const historyTable = document.querySelector('.history-table');

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
            
            const meterTypes = response.documents;
            
            // Очищаем список перед добавлением новых опций
            meterTypeSelect.innerHTML = '';

            // Добавляем опцию по умолчанию
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Выберите тип счетчика';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            meterTypeSelect.appendChild(defaultOption);

            // Добавляем типы счетчиков в список
            meterTypes.forEach(meterType => {
                const option = document.createElement('option');
                option.value = meterType.$id;
                option.textContent = meterType.name;
                meterTypeSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Ошибка загрузки типов счетчиков:', error);
            alert('Ошибка загрузки типов счетчиков');
        }
    }

    // Функция для получения истории показаний
    async function fetchMeterHistory(cityId, meterTypeId, fromDate, toDate) {
        try {
            // Получаем все счетчики для выбранного города и типа
            const metersResponse = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.meters,
                [
                    Query.equal('city_id', cityId),
                    Query.equal('meter_type_id', meterTypeId)
                ]
            );

            const meters = metersResponse.documents;
            
            if (meters.length === 0) {
                return [];
            }

            // Получаем все показания для этих счетчиков в указанном диапазоне дат
            const meterIds = meters.map(meter => meter.$id);
            const readingsResponse = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.meterReadings,
                [
                    Query.equal('meter_id', meterIds),
                    Query.greaterThanEqual('reading_date', fromDate),
                    Query.lessThanEqual('reading_date', toDate),
                    Query.orderDesc('reading_date')
                ]
            );

            const readings = readingsResponse.documents;
            
            // Группируем показания по счетчикам и создаем историю
            const history = [];
            
            for (const meter of meters) {
                const meterReadings = readings
                    .filter(reading => reading.meter_id === meter.$id)
                    .sort((a, b) => new Date(a.reading_date) - new Date(b.reading_date));

                // Создаем записи истории для каждой пары последовательных показаний
                for (let i = 1; i < meterReadings.length; i++) {
                    const prevReading = meterReadings[i - 1];
                    const currentReading = meterReadings[i];
                    
                    const consumption = currentReading.reading - prevReading.reading;
                    
                    history.push({
                        prev_date: prevReading.reading_date,
                        prev_value: prevReading.reading,
                        current_date: currentReading.reading_date,
                        current_value: currentReading.reading,
                        consumption: consumption
                    });
                }
            }

            // Сортируем по дате (новые сверху)
            history.sort((a, b) => new Date(b.current_date) - new Date(a.current_date));
            
            return history;
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            throw error;
        }
    }

    // Функция для форматирования даты
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    // Функция для отображения истории в таблице
    function renderHistoryTable(history) {
        historyTableBody.innerHTML = '';
        
        if (history.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" style="text-align: center;">Нет данных для отображения</td>';
            historyTableBody.appendChild(row);
            return;
        }

        history.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(record.prev_date)}</td>
                <td>${record.prev_value.toFixed(2)}</td>
                <td>${formatDate(record.current_date)}</td>
                <td>${record.current_value.toFixed(2)}</td>
                <td>${record.consumption.toFixed(2)}</td>
            `;
            historyTableBody.appendChild(row);
        });
    }

    // Функция для изменения цвета шапки таблицы
    function updateTableHeaderColor(cityId) {
        const historyTableHead = historyTable.querySelector('thead');
        
        // Удаляем все классы цветов
        historyTableHead.classList.remove('city-1', 'city-2', 'city-3');

        // Добавляем класс на основе ID города
        const cityHash = cityId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        const colorIndex = Math.abs(cityHash) % 3 + 1;
        historyTableHead.classList.add(`city-${colorIndex}`);
    }

    // Обработчик для кнопки "Загрузить историю"
    loadHistoryButton.addEventListener('click', async function () {
        const cityId = citySelect.value;
        const meterTypeId = meterTypeSelect.value;
        const fromDate = fromDateInput.value;
        const toDate = toDateInput.value;

        if (!cityId || !meterTypeId || !fromDate || !toDate) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            alert('Дата начала не может быть больше даты окончания');
            return;
        }

        try {
            loadHistoryButton.disabled = true;
            loadHistoryButton.textContent = 'Загрузка...';
            
            const history = await fetchMeterHistory(cityId, meterTypeId, fromDate, toDate);
            renderHistoryTable(history);
            updateTableHeaderColor(cityId);
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            alert('Ошибка загрузки истории показаний');
        } finally {
            loadHistoryButton.disabled = false;
            loadHistoryButton.textContent = 'Загрузить историю';
        }
    });

    // Обработчик изменения города
    citySelect.addEventListener('change', function () {
        const cityId = citySelect.value;
        if (cityId) {
            updateTableHeaderColor(cityId);
        }
    });

    // Установка дат по умолчанию
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    fromDateInput.value = firstDayOfMonth.toISOString().split('T')[0];
    toDateInput.value = today.toISOString().split('T')[0];

    // Инициализация приложения
    fetchCities();
    fetchMeterTypes();
}); 