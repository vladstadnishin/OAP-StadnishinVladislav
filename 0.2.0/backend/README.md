## Запуск

Сервер запускається на http://localhost:3000.

## Сутності

- GET/POST/PUT/PATCH/DELETE /api/names
- GET/POST/PUT/PATCH/DELETE /api/teachers
- GET/POST/PUT/PATCH/DELETE /api/notes
- GET/POST/PUT/PATCH/DELETE /api/users

## Формат списку для names

{
  "items": [
    {
      "id": "7c204a27-3aa7-48b0-998f-caa1d4ead146",
      "userId": "5c60517d-9464-464a-a3c0-826dc2e24b9d",
      "title": "asd",
      "teacher": "asd",
      "course": "2",
      "priority": "Середній",
      "note": "Коментар до дисципліни",
      "createdAt": "2026-04-09T21:04:31.648Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10
}

## Пошук по id

- GET http://localhost:3000/api/names
- GET http://localhost:3000/api/users