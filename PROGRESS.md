# Прогрес — Body4uHUB web

_Последно обновяване: 17.10.2026_

## Готово
- **Основа на проекта** (стъпки 1–7 от `design/design_handoff_identity/README.md`):
  - Vite + React 19 + TypeScript + Tailwind v4, alias `@/` → `src`
  - Токени (`src/index.css`), шрифтове Inter + Unbounded (`public/fonts`, `src/fonts.css`), favicon, лого (`components/brand/Logo.tsx`)
  - От handoff-а: `components/ui/button.tsx`, `lib/problem.ts`, `lib/validation.ts`
  - i18n: `locales/bg.json` (от `strings.js`), `lib/i18n.ts` (плейсхолдъри `{name}`)
  - API клиент `api/client.ts`: Bearer токен, ProblemDetails, 401 → изход; DTO типове `api/types.ts`
  - `auth/AuthContext.tsx`: сесия в sessionStorage, автоматичен изход при изтичане на JWT (60 мин)
  - Guards: `RequireAuth`, `RequireRole`, `GuestOnly`
  - Layout-и: `AuthLayout`, `AppShell` (навигация по роля, sidebar / долна навигация), `PageHeader`
  - Всички маршрути съществуват с временна страница (`pages/Placeholder.tsx`)
- **Dev сървър**: порт 3000 (съвпада с CORS на backend-а), `/api` → `https://localhost:7001`
- **GitHub**: първи commit `ab83206` в `main` на `git@github.com:DimitarKisov/Body4uHUB-FE.git`

## Следва
1. Екран 2 · Вход (`POST /api/auth/login`) — след него ще се вижда и AppShell
2. Екран 1 / 1b · Регистрация
3. Екрани 3 и 4 · Потвърждение на имейл, нов линк
4. Екрани 5–7 · Профил, редакция, смяна на парола
5. Екрани 8–9 · Админ: потребители, детайли

## Бележки
- shadcn компонентите (input, dialog, table…) се добавят заедно с екрана, който ги ползва, и се преоформят по дизайна
- По желание: `.gitattributes` с `* text=auto eol=lf` (предупреждения за LF/CRLF)
- Да се поддържа `API_MAP.md` при всеки нов екран
