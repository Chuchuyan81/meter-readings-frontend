// Инициализация Appwrite
document.addEventListener('DOMContentLoaded', async function () {
    // Инициализируем Appwrite
    if (!initAppwrite()) {
        console.error('Не удалось инициализировать Appwrite');
        return;
    }

    // Проверяем подключение и создаем сессию
    const connectionResult = await testAppwriteConnection();
    if (!connectionResult) {
        console.error('Не удалось подключиться к Appwrite');
        alert('Ошибка подключения к базе данных');
        return;
    }

    console.log('Appwrite подключен успешно');

    // Импортируем Query из Appwrite
    const { Query } = Appwrite;
    const citySelect = document.getElementById('citySelect');
    const resourceTypeSelect = document.getElementById('resourceType');
    const fromDateInput = document.getElementById('dateFrom');
    const toDateInput = document.getElementById('dateTo');
    const showButton = document.getElementById('showButton');
    const historyTableBody = document.getElementById('historyTableBody');
    const historyTable = document.querySelector('.meter-table');

    // Функция для получения списка городов
    async function fetchCities() {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                CITIES_COLLECTION_ID
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
                DATABASE_ID,
                METER_TYPES_COLLECTION_ID
            );
            
            const meterTypes = response.documents;
            
            // Очищаем список перед добавлением новых опций
            resourceTypeSelect.innerHTML = '';

            // Добавляем опцию по умолчанию
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Выберите тип счетчика';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            resourceTypeSelect.appendChild(defaultOption);

            // Добавляем типы счетчиков в список
            meterTypes.forEach(meterType => {
                const option = document.createElement('option');
                option.value = meterType.$id;
                option.textContent = meterType.name;
                resourceTypeSelect.appendChild(option);
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
                DATABASE_ID,
                METERS_COLLECTION_ID,
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
                DATABASE_ID,
                METER_READINGS_COLLECTION_ID,
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

    // Обработчик для кнопки "Показать"
    showButton.addEventListener('click', async function () {
        const cityId = citySelect.value;
        const meterTypeId = resourceTypeSelect.value;
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
            showButton.disabled = true;
            showButton.textContent = 'Загрузка...';
            
            const history = await fetchMeterHistory(cityId, meterTypeId, fromDate, toDate);
            renderHistoryTable(history);
            updateTableHeaderColor(cityId);
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            alert('Ошибка загрузки истории показаний');
        } finally {
            showButton.disabled = false;
            showButton.textContent = 'Показать';
        }
    });

    // Обработчик изменения города
    citySelect.addEventListener('change', function () {
        const cityId = citySelect.value;
        if (cityId) {
            // Активируем поле выбора типа ресурса
            resourceTypeSelect.disabled = false;
            // Активируем поля дат
            fromDateInput.disabled = false;
            toDateInput.disabled = false;
            updateTableHeaderColor(cityId);
        } else {
            // Деактивируем поля если город не выбран
            resourceTypeSelect.disabled = true;
            fromDateInput.disabled = true;
            toDateInput.disabled = true;
            showButton.disabled = true;
        }
    });

    // Обработчик изменения типа ресурса
    resourceTypeSelect.addEventListener('change', function () {
        const meterTypeId = resourceTypeSelect.value;
        if (meterTypeId) {
            // Активируем кнопку показать
            showButton.disabled = false;
        } else {
            // Деактивируем кнопку если тип ресурса не выбран
            showButton.disabled = true;
        }
    });

    // Инициализация календаря
    flatpickr(fromDateInput, {
        locale: 'ru',
        dateFormat: 'Y-m-d',
        allowInput: true
    });
    
    flatpickr(toDateInput, {
        locale: 'ru',
        dateFormat: 'Y-m-d',
        allowInput: true
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