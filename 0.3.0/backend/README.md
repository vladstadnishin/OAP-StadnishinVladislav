## Формальні критерії

### Перший рівень

1. Є модуль `db` з ініціалізацією підключення до SQLite + запуск ініціалізації перед стартом сервера.  
Що це: окремий модуль відкриває файл `app.db`, створює папку `data`, вмикає `foreign_keys`, а перед `app.listen(...)` виконується ініціалізація схеми.  
Де в коді: `backend/src/db/db.ts:14-27`, `backend/src/db/db.ts:36-48`, `backend/src/db/migrate.ts:15-64`, `backend/index.ts:83-90`.

2. Створено схему БД з `PK` і мінімум 1 `FK`-зв’язком `(1-M)`; увімкнено `PRAGMA foreign_keys = ON`.  
Що це: таблиці створюються SQL-міграціями, `users` є батьківською таблицею, а `names` і `notes` мають зовнішній ключ `userId -> users.id`.  
Де в коді: `backend/src/migrations/001_create_users.sql:2-6`, `backend/src/migrations/003_create_names.sql:2-16`, `backend/src/migrations/004_create_notes.sql:2-11`, `backend/src/db/db.ts:40-45`.

3. Реалізовано `CRUD` для основної сутності з реальною роботою через SQLite `(не "фейковий масив")`.  
Що це: основна сутність тут `names`; HTTP-маршрути ведуть у controller/service/repository, а repository виконує реальні `SELECT/INSERT/UPDATE/DELETE` у SQLite.  
Де в коді: `backend/src/routes/names.routes.ts:17-52`, `backend/src/controllers/names.controllers.ts:26-60`, `backend/src/repositories/names.repository.ts:57-129`.

4. Є мінімум один запит із `WHERE + ORDER BY + LIMIT`.  
Що це: список `names` підтримує фільтрацію, сортування і пагінацію в одному SQL-запиті, як того вимагає API-дизайн у роботі.  
Де в коді: `backend/src/repositories/names.repository.ts:40-69`.

5. Помилки БД обробляються контрольовано: `400/409` для порушення обмежень, `404` для відсутнього `id`.  
Що це: SQLite-помилки `UNIQUE / CHECK / FK / NOT NULL` мапляться в зрозумілі HTTP-відповіді, а відсутній запис окремо повертає `404`.  
Де в коді: `backend/src/middleware/error-handler.middleware.ts:42-113`, `backend/src/services/names.services.ts:113-118`.

### Другий рівень

1. Є спрощена "міграційність": таблиця `schema_migrations` `(або аналог)` і перевірка застосованих змін.  
Що це: при старті створюється журнал міграцій, далі сервер читає вже застосовані файли і виконує тільки нові SQL-кроки.  
Де в коді: `backend/src/db/migrate.ts:18-60`.

2. Додано індекс для типового пошуку/сортування.  
Що це: для частих сценаріїв додані індекси на `names(userId, createdAt)`, `names(priority, createdAt)`, `teachers(fullName, createdAt)` і `notes(userId, createdAt)`.  
Де в коді: `backend/src/migrations/002_create_teachers.sql:8-9`, `backend/src/migrations/003_create_names.sql:13-16`, `backend/src/migrations/004_create_notes.sql:10-11`.

3. Є ендпойнт, що повертає зв’язані дані `(через JOIN або два кроки з коректним агрегуванням у відповідь)`.  
Що це: `GET /api/names/with-users` повертає дисципліни разом з даними користувача через `INNER JOIN users ON users.id = names.userId`.  
Де в коді: `backend/src/routes/names.routes.ts:18-22`, `backend/src/services/names.services.ts:93-100`, `backend/src/repositories/names.repository.ts:131-154`.

5. Є одна операція, яка змінює кілька таблиць/сутностей послідовно і без розсинхронізації `(в межах дозволеного підходу)`.  
Що це: створення або оновлення `names` синхронізує також `teachers` і `notes`, тому основний запис, викладач і коментар не роз’їжджаються між різними ендпоїнтами.  
Де в коді: `backend/src/services/names.services.ts:60-80`, `backend/src/services/names.services.ts:123-141`, `backend/src/services/names.services.ts:144-163`, `backend/src/services/names.services.ts:166-187`.

### Третій рівень

1. Додано ендпойнт із агрегацією `(COUNT/SUM/AVG)` для реальної аналітики даних.  
Що це: `GET /api/names/stats/by-priority` рахує `COUNT(*)` по кожному пріоритету і повертає готову статистику для аналітики.  
Де в коді: `backend/src/routes/names.routes.ts:23-27`, `backend/src/services/names.services.ts:103-110`, `backend/src/repositories/names.repository.ts:156-172`.

2. Додано більш "виразний" запит: `JOIN + фільтри + сортування` `(або аналог)`, оформлено читабельно.  
Що це: запит `findWithUsers(...)` використовує окреме збирання `WHERE`, потім виконує `JOIN`, `ORDER BY`, `LIMIT` і `OFFSET` у читабельній формі.  
Де в коді: `backend/src/repositories/names.repository.ts:40-53`, `backend/src/repositories/names.repository.ts:131-154`.

3. Прописані і підтримуються обмеження цілісності `(UNIQUE/CHECK/NOT NULL там, де логічно)`, і вони відображаються у валідації/помилках API.  
Що це: частина правил закладена прямо в SQL-схемі, частина дублюється через `zod`-валідацію до входу в controller, а помилки БД перетворюються у стабільний формат API.  
Де в коді: `backend/src/migrations/001_create_users.sql:2-6`, `backend/src/migrations/002_create_teachers.sql:2-5`, `backend/src/migrations/003_create_names.sql:2-11`, `backend/src/migrations/004_create_notes.sql:2-7`, `backend/src/dtos/users.dtos.ts:12-25`, `backend/src/dtos/names.dtos.ts:16-43`, `backend/src/middleware/validation.middleware.ts:20-42`, `backend/src/middleware/error-handler.middleware.ts:42-87`.

4. Схема `(таблиці/зв’язки)`, які ендпойнти за що відповідають, приклади `2-3` запитів.  
Що це: нижче в цьому README окремо винесені коротка схема БД, карта ендпоїнтів і приклади запитів для швидкої перевірки проєкту.  
Де в коді: `backend/src/migrations/001_create_users.sql:2-6`, `backend/src/migrations/003_create_names.sql:2-16`, `backend/src/migrations/004_create_notes.sql:2-11`, `backend/index.ts:71-75`, `backend/src/routes/names.routes.ts:17-52`, `backend/src/routes/users.routes.ts:15-40`, `backend/src/routes/teachers.routes.ts:16-52`, `backend/src/routes/notes.routes.ts:15-40`.

## Схема БД

- `users`: користувачі системи. Поля: `id`, `fullName`, `email`, `createdAt`.
- `names`: основна сутність фронтенду. Поля: `id`, `userId`, `title`, `teacher`, `course`, `priority`, `note`, `createdAt`.
- `teachers`: довідник викладачів, який синхронізується з `names.teacher`. Поля: `id`, `fullName`, `createdAt`.
- `notes`: список коментарів, який синхронізується з `names.note`. Поля: `id`, `userId`, `content`, `createdAt`.
- Зв’язки: `users (1) -> names (M)` і `users (1) -> notes (M)` через `ON DELETE CASCADE`.

## Які ендпоїнти за що відповідають

- `/api/users`: CRUD для користувачів.
- `/api/names`: CRUD для основної сутності, з якою працює фронтенд.
- `/api/teachers`: CRUD для довідника викладачів; записи тут синхронізуються з `names.teacher`.
- `/api/notes`: CRUD для коментарів; записи тут синхронізуються з `names.note`.
- `/api/names/with-users`: список `names` разом з даними користувача через `JOIN`.
- `/api/names/stats/by-priority`: статистика кількості записів по пріоритетах.
- `/api/teachers/unsafe-search`: окремий демонстраційний endpoint для прикладу небезпечного SQL-пошуку.

## Приклади 3 запитів

1. `GET http://localhost:3000/api/names?page=1&pageSize=10&sortDir=desc`
2. `GET http://localhost:3000/api/names/with-users?page=1&pageSize=10&sortDir=desc`
3. `GET http://localhost:3000/api/names/stats/by-priority`

## Додатково про старт сервера

- `npm run start`: запускає сервер.
- `npm run check`: запускає перевірку TypeScript без генерації файлів.
- `npm run seed`: окремо заповнює БД seed-даними.
- Під час звичайного старту сервер сам виконує `migrate()` і, якщо `users` порожня, викликає `seedDatabase()`; це видно в `backend/index.ts:83-90` і `backend/src/db/seed.ts:143-160`.
