// Модуль для работы с аутентификацией Appwrite
class AuthManager {
    constructor() {
        this.client = new Appwrite.Client();
        this.account = new Appwrite.Account(this.client);
        
        this.client
            .setEndpoint(APPWRITE_CONFIG.endpoint)
            .setProject(APPWRITE_CONFIG.projectId);
            
        this.currentUser = null;
        this.isAuthenticated = false;
    }
    
    // Инициализация - проверка текущего пользователя
    async init() {
        try {
            this.currentUser = await this.account.get();
            this.isAuthenticated = true;
            this.updateUI();
            return this.currentUser;
        } catch (error) {
            this.isAuthenticated = false;
            this.currentUser = null;
            return null;
        }
    }
    
    // Вход в систему
    async login(email, password) {
        try {
            await this.account.createEmailPasswordSession(email, password);
            this.currentUser = await this.account.get();
            this.isAuthenticated = true;
            this.updateUI();
            return this.currentUser;
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    }
    
    // Регистрация
    async register(name, email, password) {
        try {
            await this.account.create(Appwrite.ID.unique(), email, password, name);
            return await this.login(email, password);
        } catch (error) {
            throw new Error(this.getErrorMessage(error));
        }
    }
    
    // Выход из системы
    async logout() {
        try {
            await this.account.deleteSession('current');
            this.currentUser = null;
            this.isAuthenticated = false;
            this.updateUI();
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    }
    
    // Получение текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Проверка авторизации
    isLoggedIn() {
        return this.isAuthenticated;
    }
    
    // Обновление UI в зависимости от статуса авторизации
    updateUI() {
        const userInfo = document.getElementById('userInfo');
        const loginLink = document.getElementById('loginLink');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (this.isAuthenticated && this.currentUser) {
            if (userInfo) {
                userInfo.textContent = `Привет, ${this.currentUser.name}!`;
                userInfo.style.display = 'block';
            }
            if (loginLink) loginLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
        } else {
            if (userInfo) userInfo.style.display = 'none';
            if (loginLink) loginLink.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }
    
    // Получение понятного сообщения об ошибке
    getErrorMessage(error) {
        switch (error.type) {
            case 'user_invalid_credentials':
                return 'Неверный email или пароль';
            case 'user_already_exists':
                return 'Пользователь с таким email уже существует';
            case 'user_password_mismatch':
                return 'Неверный пароль';
            case 'general_argument_invalid':
                return 'Проверьте правильность введенных данных';
            case 'user_session_missing':
                return 'Необходимо войти в систему';
            default:
                return error.message || 'Произошла ошибка';
        }
    }
    
    // Проверка необходимости авторизации для определенных действий
    requireAuth(action = 'выполнить это действие') {
        if (!this.isAuthenticated) {
            const shouldRedirect = confirm(`Для того чтобы ${action}, необходимо войти в систему. Перейти на страницу входа?`);
            if (shouldRedirect) {
                window.location.href = 'auth.html';
            }
            return false;
        }
        return true;
    }
    
    // Добавление UI элементов для авторизации
    addAuthUI() {
        const header = document.querySelector('header');
        if (header && !document.getElementById('authUI')) {
            const authUI = document.createElement('div');
            authUI.id = 'authUI';
            authUI.className = 'auth-ui';
            authUI.innerHTML = `
                <div id="userInfo" style="display: none; color: white; margin-right: 15px;"></div>
                <a href="auth.html" id="loginLink" class="nav-link nav-link-light">Вход</a>
                <button id="logoutBtn" class="nav-link nav-link-light" style="display: none; background: none; border: none; color: white; cursor: pointer;">Выход</button>
            `;
            
            // Добавляем стили
            const style = document.createElement('style');
            style.textContent = `
                .auth-ui {
                    display: flex;
                    align-items: center;
                    margin-left: auto;
                }
                
                header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                header nav {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
            `;
            document.head.appendChild(style);
            
            // Добавляем в header
            const nav = header.querySelector('nav');
            if (nav) {
                nav.appendChild(authUI);
            } else {
                header.appendChild(authUI);
            }
            
            // Добавляем обработчик для кнопки выхода
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.logout().then(() => {
                        window.location.reload();
                    });
                });
            }
        }
    }
}

// Создаем глобальный экземпляр
const authManager = new AuthManager();

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await authManager.init();
    authManager.addAuthUI();
});

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

// Глобальный доступ
window.authManager = authManager; 