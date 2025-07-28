const appwrite = require('node-appwrite');

console.log('Доступные классы в node-appwrite:');
console.log(Object.keys(appwrite));

// Проверяем конкретные классы
console.log('\nПроверяем конкретные классы:');
console.log('Client:', typeof appwrite.Client);
console.log('Projects:', typeof appwrite.Projects);
console.log('Databases:', typeof appwrite.Databases);
console.log('Teams:', typeof appwrite.Teams);
console.log('Account:', typeof appwrite.Account); 