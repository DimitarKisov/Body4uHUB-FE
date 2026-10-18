# API map — screen → endpoint → handled statuses

Identity API: `https://localhost:7001` (dev), proxied by Vite as `/api/*`. Errors: RFC 7807 ProblemDetails; 400 carries `errors: [{ field, error }]` (field = PascalCase property name).

| Screen | Route | Endpoint | Statuses handled | State |
|---|---|---|---|---|
| 1 Регистрация | `/register` | `POST /api/auth/register` → `UserDto` (201) | — | placeholder |
| 1b Провери пощата си | `/register/check-email` | — | — | placeholder |
| 2 Вход | `/login` | `POST /api/auth/login` → `AuthResponseDto` | — | placeholder |
| 3 Потвърждение на имейл | `/confirm-email` | `POST /api/auth/confirm-email` (204) | — | placeholder |
| 4 Нов линк | `/resend-confirmation` | `POST /api/auth/resend-confirmation` (204) | — | placeholder |
| 5 Моят профил | `/profile` | `GET /api/users/me` | — | placeholder |
| 6 Редакция на профила | `/profile/edit` | `PUT /api/users/me` | — | placeholder |
| 7 Смяна на парола | `/security` | `POST /api/users/me/change-password` | — | placeholder |
| 8 Потребители | `/admin/users` | `GET /api/users` | — | placeholder |
| 9 Детайли за потребител | `/admin/users/:id` | `GET /api/users/{id}`, `GET /api/roles`, `POST /api/users/{userId}/roles`, `POST /api/users/trainers`, `DELETE /api/users/trainers/{userId}` | — | placeholder |

Global: any 401 on an authenticated call → session cleared → `/login` (`src/api/client.ts` + `src/auth/AuthContext.tsx`).
