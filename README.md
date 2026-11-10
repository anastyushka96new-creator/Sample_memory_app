# VibeApp — эталонный скелет

Список задач с тегами: React + TypeScript + Vite, данные в localStorage, упаковка в Android через Capacitor. Это учебный каркас: логика минимальна, зато ограждения против «божественных файлов», техдолга и галлюцинаций ИИ уже работают. Свою идею наращивайте срезами (см. `vibe-coding-rules-v3.md`).

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

## Документы проекта
- [`GAME_SPEC.md`](GAME_SPEC.md) — утверждённая продуктовая спецификация игры Memory, правила и ограничения MVP.
- [`GAME_SPEC_ADDENDUM.md`](GAME_SPEC_ADDENDUM.md) — уточнения по случайности, алгоритму и ошибкам бота, пакетной загрузке и обработке из��бражений.
- [`CONVENTIONS.md`](CONVENTIONS.md) — правила разработки и протокол работы ИИ.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — карта слоёв и потоков данных.
- [`DECISIONS.md`](DECISIONS.md) — ADR и обоснования архитектурных решений.
- [`PROGRESS.md`](PROGRESS.md) — текущее состояние разработки и следующие шаги.

При начале нового чата передавайте `GAME_SPEC.md`, `GAME_SPEC_ADDENDUM.md`, `CONVENTIONS.md`, `ARCHITECTURE.md`, `DECISIONS.md` и `PROGRESS.md`: вместе они дают продуктовые требования, уточнения, правила работы, устройство проекта, принятые решения и актуальный статус.
