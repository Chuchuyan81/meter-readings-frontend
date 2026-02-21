document.addEventListener('DOMContentLoaded', function() {
    // Инициализация элементов
    const citySelect = document.getElementById('citySelect');
    const resourceType = document.getElementById('resourceType');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const showButton = document.getElementById('showButton');
    const historyTableBody = document.getElementById('historyTableBody');

    // Инициализация календарей
    const dateFromPicker = flatpickr(dateFrom, {
        locale: 'ru',
        dateFormat: 'd.m.Y',
        maxDate: 'today'
    });

    const dateToPicker = flatpickr(dateTo, {
        locale: 'ru',
        dateFormat: 'd.m.Y',
        maxDate: 'today'
    });

    // Загрузка списка городов
    fetch('/api/cities')
        .then(response => response.json())
        .then(cities => {
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.id;
                option.textContent = city.name;
                citySelect.appendChild(option);
            });
        })
        .catch(error => console.error('Ошибка при загрузке городов:', error));

    // Обработчик выбора города
    citySelect.addEventListener('change', function() {
        resourceType.disabled = !this.value;
        resourceType.innerHTML = '<option value="">Выберите тип ресурса</option>';
        dateFrom.disabled = true;
        dateTo.disabled = true;
        showButton.disabled = true;

        if (this.value) {
            // Загрузка типов ресурсов для выбранного города
            fetch(`/api/meters/${this.value}`)
                .then(response => response.json())
                .then(meters => {
                    // Создаем уникальный список типов ресурсов
                    const uniqueTypes = [...new Set(meters.map(meter => meter.meter_type))];
                    uniqueTypes.forEach(type => {
                        const option = document.createElement('option');
                        option.value = type;
                        option.textContent = type;
                        resourceType.appendChild(option);
                    });
                })
                .catch(error => console.error('Ошибка при загрузке типов ресурсов:', error));
        }
    });

    // Обработчик выбора типа ресурса
    resourceType.addEventListener('change', function() {
        dateFrom.disabled = !this.value;
        dateTo.disabled = !this.value;
        showButton.disabled = !this.value;
    });

    // Обработчик нажатия кнопки "Показать"
    showButton.addEventListener('click', function() {
        const cityId = parseInt(citySelect.value);
        const type = resourceType.value;
        const fromDate = dateFrom.value;
        const toDate = dateTo.value;

        if (!cityId || !type || !fromDate || !toDate) {
            alert('Пожалуйста, заполните все поля фильтра');
            return;
        }

        // Форматирование дат для API
        const formatDate = (dateStr) => {
            const [day, month, year] = dateStr.split('.');
            return `${year}-${month}-${day}`;
        };

        // Запрос истории показаний
        fetch(`/api/meter-history?city_id=${cityId}&meter_type=${encodeURIComponent(type)}&from_date=${formatDate(fromDate)}&to_date=${formatDate(toDate)}`)
            .then(response => response.json())
            .then(history => {
                historyTableBody.innerHTML = '';
                history.forEach(record => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formatDateForDisplay(record.prev_date)}</td>
                        <td>${record.prev_value}</td>
                        <td>${formatDateForDisplay(record.current_date)}</td>
                        <td>${record.current_value}</td>
                        <td>${record.consumption}</td>
                    `;
                    historyTableBody.appendChild(row);
                });

                if (history.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="5" class="no-data">Нет данных за выбранный период</td>';
                    historyTableBody.appendChild(row);
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке истории:', error);
                historyTableBody.innerHTML = '<tr><td colspan="5" class="error">Ошибка при загрузке данных</td></tr>';
            });
    });

    // Вспомогательная функция для форматирования даты
    function formatDateForDisplay(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU');
    }
}); 