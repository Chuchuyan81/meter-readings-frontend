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

    // Импортируем необходимые классы из Appwrite
    const { Query, ID } = Appwrite;
    const citySelect = document.getElementById('citySelect');
    const meterTypeSelect = document.getElementById('meterTypeSelect');
    const tariffInput = document.getElementById('tariffInput');
    const updateTariffButton = document.getElementById('updateTariffButton');
    const tariffsTableBody = document.getElementById('tariffsTableBody');
    const tariffsTable = document.querySelector('.tariffs-table');

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

    // Функция для получения всех тарифов
    async function fetchAllTariffs() {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                TARIFFS_COLLECTION_ID,
                [Query.orderDesc('start_date')]
            );
            
            const tariffs = response.documents;
            
            // Получаем информацию о городах и типах счетчиков
            const cities = await databases.listDocuments(
                DATABASE_ID,
                CITIES_COLLECTION_ID
            );
            
            const meterTypes = await databases.listDocuments(
                DATABASE_ID,
                METER_TYPES_COLLECTION_ID
            );
            
            // Создаем карты для быстрого поиска
            const cityMap = new Map(cities.documents.map(city => [city.$id, city.name]));
            const meterTypeMap = new Map(meterTypes.documents.map(type => [type.$id, type.name]));
            
            // Обогащаем тарифы информацией о городах и типах
            const enrichedTariffs = tariffs.map(tariff => ({
                ...tariff,
                city_name: cityMap.get(tariff.city_id) || 'Неизвестный город',
                meter_type_name: meterTypeMap.get(tariff.tariff_type_id) || 'Неизвестный тип'
            }));
            
            return enrichedTariffs;
        } catch (error) {
            console.error('Ошибка загрузки тарифов:', error);
            throw error;
        }
    }

    // Функция для форматирования даты
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    // Функция для отображения тарифов в таблице
    function renderTariffsTable(tariffs) {
        tariffsTableBody.innerHTML = '';
        
        if (tariffs.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6" style="text-align: center;">Нет данных для отображения</td>';
            tariffsTableBody.appendChild(row);
            return;
        }

        tariffs.forEach(tariff => {
            const row = document.createElement('tr');
            
            // Определяем статус тарифа
            const isActive = !tariff.end_date;
            const statusClass = isActive ? 'active' : 'inactive';
            const statusText = isActive ? 'Активный' : 'Неактивный';
            
            row.innerHTML = `
                <td data-label="Город">${tariff.city_name}</td>
                <td data-label="Тип счетчика">${tariff.meter_type_name}</td>
                <td data-label="Тариф">${tariff.tariff.toFixed(4)}</td>
                <td data-label="Дата начала">${formatDate(tariff.start_date)}</td>
                <td data-label="Дата окончания">${formatDate(tariff.end_date)}</td>
                <td data-label="Статус"><span class="status ${statusClass}">${statusText}</span></td>
            `;
            tariffsTableBody.appendChild(row);
        });
    }

    // Функция для изменения цвета шапки таблицы
    function updateTableHeaderColor(cityId) {
        const tariffsTableHead = tariffsTable.querySelector('thead');
        
        // Удаляем все классы цветов
        tariffsTableHead.classList.remove('city-1', 'city-2', 'city-3');

        // Добавляем класс на основе ID города
        const cityHash = cityId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        const colorIndex = Math.abs(cityHash) % 3 + 1;
        tariffsTableHead.classList.add(`city-${colorIndex}`);
    }

    // Функция для обновления тарифа
    async function updateTariff(cityId, meterTypeId, newTariff) {
        try {
            const currentDate = new Date().toISOString();
            
            // Ищем активный тариф для данного города и типа счетчика
            const activeResponse = await databases.listDocuments(
                DATABASE_ID,
                TARIFFS_COLLECTION_ID,
                [
                    Query.equal('city_id', cityId),
                    Query.equal('tariff_type_id', meterTypeId),
                    Query.isNull('end_date')
                ]
            );
            
            // Если есть активный тариф, закрываем его
            if (activeResponse.documents.length > 0) {
                const activeTariff = activeResponse.documents[0];
                await databases.updateDocument(
                    DATABASE_ID,
                    TARIFFS_COLLECTION_ID,
                    activeTariff.$id,
                    {
                        end_date: currentDate
                    }
                );
            }
            
            // Создаем новый тариф
            await databases.createDocument(
                DATABASE_ID,
                TARIFFS_COLLECTION_ID,
                ID.unique(),
                {
                    city_id: cityId,
                    tariff_type_id: meterTypeId,
                    tariff: newTariff,
                    start_date: currentDate,
                    end_date: null
                }
            );
            
            return true;
        } catch (error) {
            console.error('Ошибка обновления тарифа:', error);
            throw error;
        }
    }

    // Обработчик для кнопки "Обновить тариф"
    updateTariffButton.addEventListener('click', async function () {
        const cityId = citySelect.value;
        const meterTypeId = meterTypeSelect.value;
        const tariffValue = parseFloat(tariffInput.value);

        if (!cityId || !meterTypeId || isNaN(tariffValue) || tariffValue <= 0) {
            alert('Пожалуйста, заполните все поля корректными значениями');
            return;
        }

        try {
            updateTariffButton.disabled = true;
            updateTariffButton.textContent = 'Обновление...';
            
            await updateTariff(cityId, meterTypeId, tariffValue);
            
            alert('Тариф успешно обновлен!');
            
            // Очищаем форму
            citySelect.value = '';
            meterTypeSelect.value = '';
            tariffInput.value = '';
            
            // Обновляем таблицу
            await loadTariffs();
        } catch (error) {
            console.error('Ошибка обновления тарифа:', error);
            alert('Ошибка обновления тарифа');
        } finally {
            updateTariffButton.disabled = false;
            updateTariffButton.textContent = 'Обновить тариф';
        }
    });

    // Обработчик изменения города
    citySelect.addEventListener('change', function () {
        const cityId = citySelect.value;
        if (cityId) {
            updateTableHeaderColor(cityId);
        }
    });

    // Функция для загрузки и отображения тарифов
    async function loadTariffs() {
        try {
            const tariffs = await fetchAllTariffs();
            renderTariffsTable(tariffs);
        } catch (error) {
            console.error('Ошибка загрузки тарифов:', error);
            alert('Ошибка загрузки тарифов');
        }
    }

    // Инициализация приложения
    fetchCities();
    fetchMeterTypes();
    loadTariffs();
}); 