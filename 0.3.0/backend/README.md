## Запуск

Сервер запускається на [http://localhost:3000](http://localhost:3000).

Команди:

- `npm install`
- `npm run start`
- `npm run check`
- `npm run seed`

Під час старту сервер:

- відкриває SQLite-файл `backend/data/app.db`
- вмикає `PRAGMA foreign_keys = ON`
- застосовує всі SQL-міграції з `backend/src/migrations`
- якщо таблиця `users` порожня, автоматично додає seed-дані

## Схема БД

### users

- `id` - `TEXT PRIMARY KEY`
- `fullName` - `TEXT NOT NULL`
- `email` - `TEXT NOT NULL UNIQUE`
- `createdAt` - `TEXT NOT NULL`

### names

- `id` - `TEXT PRIMARY KEY`
- `userId` - `TEXT NOT NULL`
- `title` - `TEXT NOT NULL`
- `teacher` - `TEXT NOT NULL`
- `course` - `TEXT NOT NULL`
- `priority` - `TEXT NOT NULL`
- `note` - `TEXT NOT NULL`
- `createdAt` - `TEXT NOT NULL`

### teachers

- `id` - `TEXT PRIMARY KEY`
- `fullName` - `TEXT NOT NULL`
- `createdAt` - `TEXT NOT NULL`

### notes

- `id` - `TEXT PRIMARY KEY`
- `userId` - `TEXT NOT NULL`
- `content` - `TEXT NOT NULL`
- `createdAt` - `TEXT NOT NULL`

## Як зараз поводяться сутності

`names` у цьому проєкті є основною сутністю для фронтенду.

Саме тому:

- при створенні або оновленні запису в `names` бекенд автоматично синхронізує `teachers`
- ім’я викладача з `names.teacher` потрапляє в `/api/teachers`
- коментар з `names.note` потрапляє в `/api/notes`

Це зроблено спеціально, щоб нові записи, створені з фронтенду, не залишались видимими тільки в `/api/names`.

Додаткові правила узгодженості:

- якщо `teacher` уже використовується в `names`, то `PUT/PATCH/DELETE` для такого запису в `/api/teachers` повертає `409 CONFLICT`
- якщо `note` синхронізована з `names`, то `PUT/PATCH/DELETE` для такого запису в `/api/notes` теж повертає `409 CONFLICT`

Причина проста: для таких записів джерелом істини є `/api/names`, а не окремі таблиці.

## Поведінка при видаленні FK

У роботі використано підхід `ON DELETE CASCADE` для залежних сутностей користувача:

- `names.userId -> users.id ON DELETE CASCADE`
- `notes.userId -> users.id ON DELETE CASCADE`

Обґрунтування:

- `names` і `notes` логічно належать конкретному користувачу
- після видалення користувача ці записи не мають сенсу окремо
- каскадне видалення не залишає "сиріт" у БД
- таку поведінку гарантує сама SQLite, а не тільки код сервісів

Для `teachers` зовнішній ключ не використовується.

Обґрунтування:

- у `names` зберігається не `teacherId`, а простий текстовий `teacher`
- через це `teachers` у цій версії проєкту є довідковою сутністю, а не батьківською таблицею для `names`
- щоб не зламати узгодженість, запис викладача, який уже використовується в `names`, не можна редагувати або видаляти через `/api/teachers`

Тобто в проєкті використані обидві ідеї:

- `ON DELETE CASCADE` там, де є справжній FK до `users`
- заборона змін через `409 CONFLICT` там, де зв’язок підтримується сервісною логікою, а не FK

## Основні ендпойнти

CRUD-маршрути:

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/names`
- `GET /api/names/:id`
- `POST /api/names`
- `PUT /api/names/:id`
- `PATCH /api/names/:id`
- `DELETE /api/names/:id`
- `GET /api/teachers`
- `GET /api/teachers/:id`
- `POST /api/teachers`
- `PUT /api/teachers/:id`
- `PATCH /api/teachers/:id`
- `DELETE /api/teachers/:id`
- `GET /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `PATCH /api/notes/:id`
- `DELETE /api/notes/:id`

Додаткові маршрути:

- `GET /api/names/with-users`
- `GET /api/names/stats/by-priority`
- `GET /api/teachers/unsafe-search`

## Приклади запитів

### Список дисциплін

`GET http://localhost:3000/api/names?page=1&pageSize=10&sortDir=desc`

### Список дисциплін разом з користувачами

`GET http://localhost:3000/api/names/with-users?page=1&pageSize=10&sortDir=desc`

### Пошук дисципліни за id

`GET http://localhost:3000/api/names/55555555-5555-4555-8555-555555555555`

### Список викладачів

`GET http://localhost:3000/api/teachers?page=1&pageSize=10&sortDir=desc`

### Пошук викладача за id

`GET http://localhost:3000/api/teachers/33333333-3333-4333-8333-333333333333`

### Список нотаток

`GET http://localhost:3000/api/notes?page=1&pageSize=10&sortDir=desc`

### Пошук нотатки за id

`GET http://localhost:3000/api/notes/55555555-5555-4555-8555-555555555555`

### Статистика за пріоритетами

`GET http://localhost:3000/api/names/stats/by-priority`

### Небезпечний endpoint для демонстрації SQL injection

`GET http://localhost:3000/api/teachers/unsafe-search?search=olha`

## Очікуваний формат помилки

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": []
  }
}
```
