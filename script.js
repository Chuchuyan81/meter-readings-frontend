document.addEventListener('DOMContentLoaded', function () {
    const citySelect = document.getElementById('citySelect');
    const meterTableBody = document.getElementById('meterTableBody');
    const totalAmountDiv = document.getElementById('totalAmount');
    const saveButton = document.getElementById('saveButton');
    const meterTable = document.querySelector('.meter-table'); // Получаем таблицу
    const meterTableHead = meterTable.querySelector('thead'); // Получаем шапку таблицы
    let metersData = [];
    let selectedCityId = null;

    // Функция для получения списка городов и заполнения select
    function fetchCities() {
        fetch('/api/cities')
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.status);
                }
                return response.json();
            })
            .then(cities => {
                if (cities && Array.isArray(cities)) {
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
                        option.value = city.id;
                        option.textContent = city.name;
                        citySelect.appendChild(option);
                    });
                } else {
                    console.error('Неверный формат данных о городах', cities);
                    alert('Неверный формат данных о городах');
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки городов:', error);
                alert('Ошибка загрузки городов');
            });
    }

    // Функция для получения списка счетчиков по городу
    function fetchMeters(cityId) {
        fetch(`/api/meters/${cityId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.status);
                }
                return response.json();
            })
            .then(meters => {
                if (meters && Array.isArray(meters)) {
                    metersData = meters;
                    renderMeterTable(meters);
                } else {
                    console.error('Неверный формат данных о счетчиках', meters);
                    alert('Неверный формат данных о счетчиках');
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки счетчиков:', error);
                alert('Ошибка загрузки счетчиков');
            });
    }

    // Функция для форматирования даты в формат дд.мм.гггг
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
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
        meterTableHead.classList.remove('city-1', 'city-2', 'city-3'); // Добавьте больше классов, если городов больше

        // Добавляем класс в зависимости от выбранного города
        if (cityId === '1') {
            meterTableHead.classList.add('city-1');
        } else if (cityId === '2') {
            meterTableHead.classList.add('city-2');
        } else if (cityId === '3') {
            meterTableHead.classList.add('city-3');
        }
        // Добавьте больше условий, если городов больше
    }

    // Обработчик события для выпадающего списка выбора города
    citySelect.addEventListener('change', function () {
        selectedCityId = citySelect.value;
        if (selectedCityId) {
            fetchMeters(selectedCityId);
            updateTableHeaderColor(selectedCityId); // Обновляем цвет шапки
        }
    });

    // Обработчик для поля показаний (расчет при потере фокуса)
    meterTableBody.addEventListener('focusout', function (event) {
        if (event.target.classList.contains('currentReading')) {
            const currentReadingInput = event.target;
            const meterId = parseInt(currentReadingInput.dataset.meterId);
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
    saveButton.addEventListener('click', function () {
        const readingsToSave = [];
        meterTableBody.querySelectorAll('tr').forEach(row => {
            const currentReadingInput = row.querySelector('.currentReading');
            if (currentReadingInput && currentReadingInput.value !== '') {
                const meterId = parseInt(currentReadingInput.dataset.meterId);
                const reading = parseFloat(currentReadingInput.value);
                readingsToSave.push({
                    meterId: meterId,
                    reading: reading
                });
            }
        });
        if (readingsToSave.length > 0) {
            fetch('/api/meter-readings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(readingsToSave)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.message) {
                        alert(data.message);
                        if (selectedCityId) {
                            fetchMeters(selectedCityId);
                        }
                    } else {
                        console.error('Error while saving readings', data);
                        alert('Error while saving readings');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while saving readings');
                });
        }
    });

    // Обработчик для кнопки печати
    document.getElementById('printButton').addEventListener('click', function() {
        const selectedCity = document.getElementById('citySelect').value;
        const cityName = document.getElementById('citySelect').options[document.getElementById('citySelect').selectedIndex].text;

        // Проверяем, что выбран нужный город (Котовского 45)
        if (!cityName.includes('Котовского 45')) {
            alert('Печать справки доступна только для адреса Котовского 45');
            return;
        }

        // Получаем данные из таблицы
        const rows = document.querySelectorAll('#meterTableBody tr');
        let coldWaterData = null;
        let hotWaterData = null;

        rows.forEach(row => {
            const resourceType = row.querySelector('td:first-child').textContent.trim().toLowerCase();
            const prevReading = parseFloat(row.querySelector('td:nth-child(3)').textContent.replace(',', '.'));
            const currentReading = parseFloat(row.querySelector('input[type="number"]').value.replace(',', '.'));

            // Проверяем, что оба значения — числа
            if (!isNaN(prevReading) && !isNaN(currentReading)) {
                const consumption = currentReading - prevReading;
                if (resourceType.includes('холодная')) {
                    coldWaterData = { prev: prevReading, current: currentReading, total: consumption };
                } else if (resourceType.includes('горячая')) {
                    hotWaterData = { prev: prevReading, current: currentReading, total: consumption };
                }
            }
        });

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

        // Открываем страницу печати в новом окне
        window.open(`print.html?${params.toString()}`, '_blank');
    });

    fetchCities();
});