document.addEventListener('DOMContentLoaded', function() {
    // Инициализация элементов
    const citySelect = document.getElementById('citySelect');
    const resourceType = document.getElementById('resourceType');
    const tariffInfo = document.getElementById('tariffInfo');
    const resourceName = document.getElementById('resourceName');
    const currentTariff = document.getElementById('currentTariff');
    const newTariff = document.getElementById('newTariff');
    const saveTariffButton = document.getElementById('saveTariffButton');

    let selectedMeterId = null;
    let selectedCityId = null;

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
        tariffInfo.style.display = 'none';
        selectedCityId = this.value;

        if (this.value) {
            // Загрузка типов ресурсов для выбранного города
            fetch(`/api/meters/${this.value}`)
                .then(response => response.json())
                .then(meters => {
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
        if (this.value && selectedCityId) {
            fetch(`/api/meters/${selectedCityId}`)
                .then(response => response.json())
                .then(meters => {
                    const selectedMeter = meters.find(meter => meter.meter_type === this.value);
                    if (selectedMeter) {
                        selectedMeterId = selectedMeter.meter_id;
                        resourceName.textContent = selectedMeter.meter_type;
                        currentTariff.textContent = selectedMeter.current_tariff ? 
                            `${selectedMeter.current_tariff} руб.` : 'Не установлен';
                        tariffInfo.style.display = 'block';
                        newTariff.value = '';
                    }
                })
                .catch(error => console.error('Ошибка при загрузке информации о тарифе:', error));
        } else {
            tariffInfo.style.display = 'none';
        }
    });

    // Обработчик нажатия кнопки "Сохранить"
    saveTariffButton.addEventListener('click', function() {
        const tariffValue = parseFloat(newTariff.value);
        
        if (!tariffValue || isNaN(tariffValue) || tariffValue <= 0) {
            alert('Пожалуйста, введите корректное значение тарифа');
            return;
        }

        if (!selectedMeterId || !selectedCityId) {
            alert('Пожалуйста, выберите город и тип ресурса');
            return;
        }

        // Отправка нового тарифа на сервер
        fetch('/api/tariffs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meter_id: selectedMeterId,
                city_id: selectedCityId,
                tariff: tariffValue
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            alert('Тариф успешно обновлен');
            currentTariff.textContent = `${tariffValue} руб.`;
            newTariff.value = '';
        })
        .catch(error => {
            console.error('Ошибка при сохранении тарифа:', error);
            alert('Произошла ошибка при сохранении тарифа');
        });
    });
}); 