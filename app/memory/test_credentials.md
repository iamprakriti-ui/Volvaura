# Volvaura – Test Credentials

## Admin
- Email: `admin@volvaura.com`
- Password: `admin12345`
- Role: admin

## Test Creator (seeded on startup)
- Email: `creator@volvaura.com`
- Password: `creator123`
- Role: creator

## Test Editor (seeded on startup)
- Email: `editor@volvaura.com`
- Password: `editor123`
- Role: editor

## Auth endpoints (all prefixed with `/api`)
- POST `/api/auth/register`  body: `{ name, email, password, role: "creator"|"editor" }`
- POST `/api/auth/login`     body: `{ email, password }`
- POST `/api/auth/logout`
- GET  `/api/auth/me`
- POST `/api/auth/refresh`
- POST `/api/auth/forgot-password`  body: `{ email }` (reset link logged to backend console)
- POST `/api/auth/reset-password`   body: `{ token, new_password }`

## Auth notes
- httpOnly cookies (`access_token` + `refresh_token`) set on login/register. Frontend axios calls use `withCredentials: true`.
- `Authorization: Bearer <token>` fallback is also accepted.

## Core resources
- GET  `/api/editors`  (query: `q`, `platform`, `style`, `niche`, `min_price`, `max_price`, `availability`)
- GET  `/api/editors/{id}`
- PUT  `/api/editors/me`  (editor only – update own portfolio)
- GET  `/api/projects/mine`  (creator only)
- POST `/api/projects`  (creator only)
- POST `/api/requests`  (creator only – send collab request)
- GET  `/api/requests/incoming`  (editor only)
- GET  `/api/requests/outgoing`  (creator only)
- POST `/api/requests/{id}/respond`  (editor only – accept/decline)
- POST `/api/saved/{editor_id}`  (creator only – toggle save)
- GET  `/api/saved`  (creator only)
