/**
 * Создаёт в Appwrite коллекцию certificates и атрибуты под script-appwrite.js / appwrite-certificates.js.
 * Требуется серверный API-ключ с правами на databases.
 *
 * Запуск: npm run setup:certificates (ключ в .env как APPWRITE_API_KEY)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const { Client, Databases, Permission, Role } = require('node-appwrite');

const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68790cc0001f9d5ee482';
const DATABASE_ID = 'meter_readings_db';
const COLLECTION_ID = 'certificates';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForAttribute(databases, key, maxAttempts = 90) {
    for (let i = 0; i < maxAttempts; i++) {
        const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, key);
        if (attr.status === 'available') {
            return;
        }
        if (attr.status === 'failed') {
            throw new Error(`Атрибут "${key}" не создан: ${attr.error || JSON.stringify(attr)}`);
        }
        await sleep(1000);
    }
    throw new Error(`Таймаут ожидания атрибута "${key}"`);
}

async function ensureCollection(databases) {
    const perms = [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
    ];
    try {
        await databases.createCollection(
            DATABASE_ID,
            COLLECTION_ID,
            'Справки',
            perms,
            false,
            true
        );
        console.log('Коллекция certificates создана.');
    } catch (e) {
        if (e.code === 409) {
            console.log('Коллекция certificates уже существует, пропускаем создание.');
        } else {
            throw e;
        }
    }
}

async function ensureStringAttribute(databases, key, size, required) {
    try {
        await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, key, size, required);
        await waitForAttribute(databases, key);
        console.log(`Атрибут string "${key}" готов.`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`Атрибут "${key}" уже есть.`);
        } else {
            throw e;
        }
    }
}

async function ensureIntegerAttribute(databases, key, required, min, max) {
    try {
        await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, key, required, min, max);
        await waitForAttribute(databases, key);
        console.log(`Атрибут integer "${key}" готов.`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`Атрибут "${key}" уже есть.`);
        } else {
            throw e;
        }
    }
}

async function ensureFloatAttribute(databases, key, required) {
    try {
        await databases.createFloatAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            key,
            required,
            undefined,
            undefined,
            undefined,
            undefined
        );
        await waitForAttribute(databases, key);
        console.log(`Атрибут float "${key}" готов.`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`Атрибут "${key}" уже есть.`);
        } else {
            throw e;
        }
    }
}

async function ensureDatetimeAttribute(databases, key, required) {
    try {
        await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, key, required);
        await waitForAttribute(databases, key);
        console.log(`Атрибут datetime "${key}" готов.`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`Атрибут "${key}" уже есть.`);
        } else {
            throw e;
        }
    }
}

async function main() {
    const apiKey = process.env.APPWRITE_API_KEY;
    if (!apiKey || !apiKey.trim()) {
        console.error('Задайте APPWRITE_API_KEY в .env (серверный ключ Appwrite).');
        process.exit(1);
    }

    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(apiKey.trim());

    const databases = new Databases(client);

    console.log('Проверка базы данных...');
    await databases.get(DATABASE_ID);

    await ensureCollection(databases);

    await ensureStringAttribute(databases, 'apartment', 32, false);
    await ensureStringAttribute(databases, 'month', 64, true);
    await ensureIntegerAttribute(databases, 'year', true, 1970, 2100);

    await ensureFloatAttribute(databases, 'coldPrev', true);
    await ensureFloatAttribute(databases, 'coldCurrent', true);
    await ensureFloatAttribute(databases, 'coldTotal', true);
    await ensureFloatAttribute(databases, 'hotPrev', true);
    await ensureFloatAttribute(databases, 'hotCurrent', true);
    await ensureFloatAttribute(databases, 'hotTotal', true);

    await ensureDatetimeAttribute(databases, 'created_at', true);

    console.log('Готово: коллекция certificates настроена.');
}

main().catch((err) => {
    console.error('Ошибка:', err.message || err);
    if (err.response) {
        console.error(err.response);
    }
    process.exit(1);
});
