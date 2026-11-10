# ARCHITECTURE.md — карта проекта

Обновляется в том же коммите, где появляется или исчезает файл.

## Стек (точные версии зафиксированы в package-lock.json)
Node 22 · TypeScript 6.0 (strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes) ·
React 19 · Vite 8 · Zod 4 · Vitest 5 + Testing Library · ESLint 10 (flat) +
typescript-eslint (strictTypeChecked) + eslint-plugin-boundaries · Capacitor 8.
TypeScript 6.0, а не 7: typescript-eslint объявляет поддержку `<6.1`.

## Схема данных (schemaVersion = 1) — источник истины `src/domain/schema.ts`
- AppState: `{ schemaVersion: 1, tags: Tag[], tasks: Task[] }`
- Tag: `{ id: UUID, name: 1..50, color: #hex }`
- Task: `{ id: UUID, title: 1..120, completed, priority: low|medium|high, tagId: UUID|null, createdAt, updatedAt }`
- Лимиты: ≤ 200 тегов, ≤ 5000 задач. Ключ localStorage: `vibe_app_state`,
  копии: `vibe_app_state_backup_<timestamp>` (хранится 3 последних).

## Потоки данных
```
Запуск:  localStorage → RawStore.read → parseAppState(миграция→Zod→целостность) → LoadReport → UI
Правка:  UI → useActions → доменная команда (чистая) → usePersistentState → debounce 400 мс → RawStore.write
Фон:     visibilitychange / pagehide / Capacitor appStateChange / unmount → flush() (мгновенная запись)
Импорт:  файл → parseBackup → выбор режима → planImport (копия текущих данных!) → replace()
```

## Модули
### src/domain — чистая логика, 0 зависимостей кроме zod
- `schema.ts` схемы, типы, `LIMITS`, `createEmptyState` · `migrations.ts` реестр миграций
- `parse.ts` единственная точка входа внешних данных · `integrity.ts` уникальность ID, ссылки, лимиты
- `taskCommands.ts` / `tagCommands.ts` создание, переключение, удаление, каскад
- `filter.ts` фильтры и `normalizeFilter` · `search.ts` нормализация (NFC, ё→е, «й» сохраняется)
- `stats.ts` проценты · `merge.ts` объединение при импорте · `validation.ts` · `result.ts` · `fixtures.ts` (тесты)

### src/application — порты и сценарии
- `ports.ts` RawStore, Clock, IdGenerator, AppLifecycle, FileExporter, AppServices
- `storedState.ts` `loadState` (fresh/loaded/recovered/unreadable) и `saveState`
- `backup.ts` экспорт-файл, `parseBackup` (лимит 3 МБ), `planImport` · `fakes.ts` подделки для тестов

### src/infrastructure — реализации портов
- `localStorageStore.ts` · `ids.ts` (UUID + fallback без `randomUUID`) · `appLifecycle.ts` (Capacitor)
- `fileExporter.ts` скачивание файла в браузере (для Android WebView — отдельный срез, см. PROGRESS.md)

### src/ui — React
- `StorageProvider.tsx` + `storageContext.ts` единый провайдер · `usePersistentState.ts` debounce/flush/блокировка записи
- `useActions.ts` · `useImportFlow.ts` · `App.tsx` · `TaskForm/TaskList/TaskFilters/TagPanel/BackupPanel/Banners.tsx`
- `ConfirmButton.tsx` · `ErrorBoundary.tsx` · `testHarness.tsx` (тесты)

### src/app — сборка
- `main.tsx` загрузка состояния ОДИН раз до React, затем рендер · `services.ts` composition root

## Машинные проверки (`npm run check`)
`tsc` → `eslint` (границы слоёв, лимиты размера, запреты API) → `vitest` → `vite build`.
Запускается локально, в pre-commit хуке (`.githooks/pre-commit`) и в GitHub Actions.
