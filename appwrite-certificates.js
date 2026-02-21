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

    console.log('Appwrite подключен успешно (справки)');

    const { Query } = Appwrite;
    const certificatesTableBody = document.getElementById('certificatesTableBody');

    // Функция для получения списка справок
    async function fetchCertificates() {
        try {
            console.log('Загрузка списка справок из коллекции:', CERTIFICATES_COLLECTION_ID);
            const response = await databases.listDocuments(
                DATABASE_ID,
                CERTIFICATES_COLLECTION_ID,
                [
                    Query.orderDesc('created_at'),
                    Query.limit(100)
                ]
            );
            
            const certificates = response.documents;
            console.log('Загружено справок:', certificates.length);
            renderCertificatesTable(certificates);
        } catch (error) {
            console.error('Ошибка загрузки справок:', error);
            certificatesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Ошибка загрузки данных</td></tr>';
        }
    }

    // Функция для форматирования даты
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Функция для отображения справок в таблице
    function renderCertificatesTable(certificates) {
        certificatesTableBody.innerHTML = '';
        
        if (certificates.length === 0) {
            certificatesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Сохраненных справок пока нет</td></tr>';
            return;
        }

        certificates.forEach(cert => {
            const row = document.createElement('tr');
            
            const period = `${cert.month || '-'} ${cert.year || '-'}`;
            const apartment = cert.apartment || '73';
            const coldTotal = cert.coldTotal ? cert.coldTotal.toFixed(2) : '0.00';
            const hotTotal = cert.hotTotal ? cert.hotTotal.toFixed(2) : '0.00';
            
            row.innerHTML = `
                <td data-label="Дата сохранения">${formatDate(cert.created_at)}</td>
                <td data-label="Период">${period}</td>
                <td data-label="Квартира">${apartment}</td>
                <td data-label="Холодная (расход)">${coldTotal} м³</td>
                <td data-label="Горячая (расход)">${hotTotal} м³</td>
                <td data-label="Действие">
                    <button class="btn btn-primary btn-sm" onclick="openCertificate('${cert.$id}')">Открыть</button>
                </td>
            `;
            certificatesTableBody.appendChild(row);
        });
    }

    // Глобальная функция для открытия справки
    window.openCertificate = async function(docId) {
        try {
            const cert = await databases.getDocument(DATABASE_ID, CERTIFICATES_COLLECTION_ID, docId);
            
            // Формируем параметры для print.html
            const params = new URLSearchParams({
                apartment: cert.apartment || '73',
                month: cert.month,
                year: cert.year,
                coldPrev: cert.coldPrev || '0',
                coldCurrent: cert.coldCurrent || '0',
                coldTotal: (cert.coldTotal || 0).toFixed(2),
                hotPrev: cert.hotPrev || '0',
                hotCurrent: cert.hotCurrent || '0',
                hotTotal: (cert.hotTotal || 0).toFixed(2),
                fromArchive: 'true'
            });
            
            window.open(`print.html?${params.toString()}`, '_blank');
        } catch (error) {
            console.error('Ошибка при открытии справки:', error);
            alert('Не удалось загрузить данные справки');
        }
    };

    // Инициализация загрузки
    fetchCertificates();
}); 
