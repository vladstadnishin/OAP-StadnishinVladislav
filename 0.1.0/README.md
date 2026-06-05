# Кабінет студента: лабораторна робота 04

Проєкт складається з двох окремих процесів:

- `backend` - Express + SQLite API на TypeScript.
- `frontend` - vanilla TypeScript фронтенд. Вихідний код лежить у `frontend/src`, а `frontend/public/js` генерується автоматично під час збірки.

## Запуск

1. Бекенд:

```bash
cd backend
npm install
npm run start
```

2. Фронтенд:

```bash
cd frontend
npm install
npm run serve
```

Якщо використовується розширення VS Code Live Server, замість `npm run serve`
можна відкрити через нього файл `frontend/public/index.html`. Одночасно запускати
Live Server і `npm run serve` на одному порту `5500` не потрібно, інакше буде
помилка `EADDRINUSE`.

Після запуску:

- Frontend: `http://localhost:5500`
- Backend: `http://localhost:3000`
- API v1: `http://localhost:3000/api/v1`

## Структура

- `backend/index.ts` - старт сервера, CORS, підключення маршрутів `/api/v1`.
- `backend/src/dtos` - Zod-схеми вхідних DTO та типи бекенду.
- `backend/src/routes`, `controllers`, `services`, `repositories` - шари API.
- `backend/src/db` і `backend/src/migrations` - SQLite, міграції, seed-дані.
- `frontend/public/index.html` - HTML, який відкривається через dev server.
- `frontend/public/js` - згенерований JavaScript після `npm run build`; це не вихідний код і він не редагується вручну.
- `frontend/src/config.ts` - базовий URL бекенду.
- `frontend/src/dtos.ts` - типи DTO для фронтенду.
- `frontend/src/apiClient.ts` - єдине місце для `fetch`, JSON, HTTP-помилок і таймауту.
- `frontend/src/ui.ts` - DOM, валідація, таблиця, стани UI.
- `frontend/src/main.ts` - сценарії завантаження, CRUD, користувачі, пагінація/фільтр/сортування.

## Приклади запитів для перевірки

```bash
curl.exe "http://localhost:3000/api/v1/names/with-users?page=1&pageSize=10&sortDir=desc"
curl.exe "http://localhost:3000/api/v1/names/55555555-5555-4555-8555-555555555555"
curl.exe "http://localhost:3000/api/v1/users?page=1&pageSize=10&sortDir=desc"
```

Приклад створення запису:

```bash
curl.exe -X POST "http://localhost:3000/api/v1/names" -H "Content-Type: application/json" -d "{\"userId\":\"11111111-1111-4111-8111-111111111111\",\"title\":\"Програмування\",\"teacher\":\"Олена Коваль\",\"course\":\"2\",\"priority\":\"Високий\",\"note\":\"Підготуватися до модулю\"}"
```

Приклад помилки валідації:

```bash
curl.exe -X POST "http://localhost:3000/api/v1/names" -H "Content-Type: application/json" -d "{\"title\":\"A\"}"
```

Перевірка CORS/preflight:

```bash
curl.exe -i -X OPTIONS "http://localhost:3000/api/v1/names" -H "Origin: http://localhost:5500" -H "Access-Control-Request-Method: POST"
```

## Формальні критерії оцінювання

### Задовільно

1. Frontend читає дані з бекенду через `fetch` - це означає, що таблиця не має вручну забитого JSON, а бере список з API; потрібно для реальної інтеграції фронтенду з бекендом - див. `frontend/src/apiClient.ts`, `frontend/src/main.ts`, endpoint `GET /api/v1/names/with-users` у `backend/src/routes/names.routes.ts`.

2. Налаштовано CORS на бекенді для конкретного origin - це whitelist для `http://localhost:5500`/`127.0.0.1`, щоб браузер дозволив запити, але не через сліпий `*` - див. `backend/index.ts`, блок `allowedOrigins` і middleware CORS.

3. UI має стани `loading / success / error` - це повідомлення користувачу під час запиту, після успіху і при збої, щоб не було "білого екрана" - див. `frontend/src/ui.ts` (`setListStatus`, `setStatus`, `setDetailsStatus`) і `frontend/src/main.ts` (`refreshItems`, `loadDetails`).

4. Обробляються HTTP-статуси 400/404 - це перетворення помилок API у зрозумілі повідомлення та помилки полів - див. `backend/src/middleware/error-handler.middleware.ts`, `frontend/src/apiClient.ts` (`parseErrorPayload`) і `frontend/src/ui.ts` (`applyBackendErrors`).

5. Є базова конфігурація URL бекенду - це одна константа замість хардкоду адреси в різних місцях; потрібно, щоб змінити API-адресу без пошуку по всьому коду - див. `frontend/src/config.ts`.

### Добре

1. Додано інтеграцію зміни даних: `POST` і ще мінімум один із `PUT/PATCH/DELETE` - користувач може створювати, редагувати й видаляти записи через UI - див. `frontend/src/main.ts` (`submitServerItem`, `deleteItem`) і `backend/src/routes/names.routes.ts`.

2. Є єдиний модуль API-клієнта - усі запити йдуть через один шар, де централізовано `fetch`, JSON, `response.ok`, timeout і помилки - див. `frontend/src/apiClient.ts`.

3. Узгоджено формат помилок з бекендом - бекенд повертає `code`, `message`, `details`, а фронтенд читає їх і показує користувачу - див. `backend/src/middleware/error-handler.middleware.ts`, `frontend/src/dtos.ts` (`ApiErrorDto`) і `frontend/src/apiClient.ts`.

4. Після мутацій UI оновлюється коректно - після створення/оновлення/видалення повторно завантажується список, тому немає дублікатів або "фантомних" рядків - див. `frontend/src/main.ts` (`submitForm`, `deleteItem`, `refreshItems`).

5. Додано мінімальний UX - є підтвердження видалення і блокування кнопок під час запиту, щоб уникнути випадкового або подвійного виконання - див. `frontend/src/main.ts` (`window.confirm`) і `frontend/src/ui.ts` (`setFormBusy`, `setUserBusy`).

### Відмінно

1. Проєкт на TypeScript на фронтенді - TypeScript-код лежить у `frontend/src`, DTO типізовані, а браузер отримує згенерований JavaScript після збірки, бо напряму `.ts` не виконує - див. `frontend/tsconfig.json`, `frontend/src/dtos.ts`, `frontend/src/main.ts`.

2. Є фронтенд-валідація, узгоджена з бекендом - required-поля, довжини, email, курс, пріоритет і заборона цифр у назві/викладачі збігаються з серверними Zod-правилами - див. `frontend/src/ui.ts` (`validateForm`, `validateUserForm`) і `backend/src/dtos`.

3. Реалізовано погані сценарії - timeout/мережевий збій/CORS мають статус `0`, 500 показується як окреме повідомлення, а при недоступному сервері UI переходить на localStorage без падіння - див. `frontend/src/apiClient.ts` (`AbortController`, `REQUEST_TIMEOUT_MS`) і `frontend/src/main.ts` (`isNetworkOrCorsError`, `refreshItems`).

4. Є відтворювані сценарії у README - вище наведені перевірки `GET`, `POST`, помилки валідації та CORS/preflight; потрібно, щоб викладач міг швидко повторити перевірку - див. розділ "Приклади запитів для перевірки".

## Додаткові механізми, які вже були в проєкті

Окремі бонусні завдання не дороблялись як нові. Наявні пагінація, фільтрація та сортування залишені працездатними:

- API приймає `page`, `pageSize`, `priority`, `sortDir`.
- UI має кнопки попередньої/наступної сторінки, фільтр пріоритету і сортування за датою.
- Код: `backend/src/repositories/names.repository.ts`, `backend/src/dtos/names.dtos.ts`, `frontend/src/main.ts`.

## Контракти DTO і сумісність

У проєкті використовується версійний префікс `/api/v1`. Поточне правило сумісності: поля, які вже читає фронтенд (`id`, `userId`, `title`, `teacher`, `course`, `priority`, `note`, `createdAt`, `userFullName`, `userEmail`), не перейменовуються і не видаляються в межах v1. Сумісно додавати нові необов'язкові поля, якщо старий фронтенд може їх ігнорувати.

## Унікальні моменти для контрольних запитань

- Питання 1-2: фронтенд спеціально запускається з `http://localhost:5500`, а бекенд з `http://localhost:3000`; це різні origin, тому CORS перевіряється реально.
- Питання 5-6: `frontend/src/apiClient.ts` не просто обгортає `fetch`, а нормалізує `status/code/message/details` і відрізняє HTTP-помилки від мережі/CORS.
- Питання 7-8: список має окремі стани, а `empty` не вважається помилкою; при справжній помилці старі серверні дані не видаються за нові.
- Питання 9-12: `POST/PUT/DELETE` з `Content-Type: application/json` проходять через preflight `OPTIONS`, а бекенд явно дозволяє методи й заголовки тільки для frontend-origin.
- Питання 13-14: для цього проєкту breaking change буде, наприклад, перейменування `userFullName` або зміна `priority` з рядка на об'єкт; сумісна зміна - додати необов'язкове поле `updatedAt`.
- Питання 15: при `TypeError: Failed to fetch` тут треба перевірити, чи працює `backend`, чи фронтенд відкритий саме з `localhost:5500`, чи є `OPTIONS` у Network і чи повертається `Access-Control-Allow-Origin`.
