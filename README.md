# VibeApp — эталонный скелет

Список задач с тегами: React + TypeScript + Vite, данные в localStorage, упаковка в Android через Capacitor.
Это учебный каркас: логика минимальна, зато все ограждения против «божественных файлов», техдолга
и галлюцинаций ИИ уже работают. Свою идею вы наращиваете срезами (см. `vibe-coding-rules-v3.md`).

## Первый запуск (Windows PowerShell)
1. Установите Node.js 22 LTS и Git.
2. В папке проекта:
```powershell
git init            # если папка ещё не репозиторий
npm install         # заодно включает pre-commit проверку
npm run check       # должно закончиться без ошибок
npm run dev         # открыть адрес из консоли
```

## Команды
| Команда | Что делает |
|---|---|
| `npm run check` | типы → линтер → тесты → сборка. Единственная команда «готово/не готово» |
| `npm run typecheck` / `lint` / `test` | по отдельности |
| `npm run dev` | локальный сервер разработки |

## Android
Нужны Android Studio и JDK (ставятся вместе с Android Studio).
```powershell
npx cap add android     # один раз: создаёт папку android/
npm run android:sync    # сборка веба и копирование в Android-проект
npm run android:open    # открывает Android Studio → Build → Build APK(s)
```
`androidScheme: 'https'` в `capacitor.config.ts` менять после первого релиза нельзя.

## Документы
`CONVENTIONS.md` правила для ИИ · `ARCHITECTURE.md` карта · `DECISIONS.md` почему так ·
`PROGRESS.md` где мы сейчас. Эти четыре файла вставляются в каждый новый чат с ИИ.
