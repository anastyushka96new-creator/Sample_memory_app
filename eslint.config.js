// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import { createConfig, recommended } from 'eslint-plugin-boundaries/config';

const bannedInReactFreeLayers = ['react', 'react-dom', 'react-dom/*', '@capacitor/*'];

/** Слои, внутри которых запрещены "источники недетерминизма". */
const pureLayers = ['src/domain/**', 'src/application/**', 'src/ui/**'];

const mathRandomBan = {
  object: 'Math',
  property: 'random',
  message: 'Math.random() запрещён. ID создаёт infrastructure/ids.ts через crypto.randomUUID().',
};
const dateNowBan = {
  object: 'Date',
  property: 'now',
  message: 'Date.now() запрещён вне infrastructure. Время приходит параметром или через порт Clock.',
};
const randomUuidBan = {
  object: 'crypto',
  property: 'randomUUID',
  message: 'crypto.randomUUID() разрешён только в infrastructure/ids.ts. Используйте порт IdGenerator.',
};
const windowStorageBans = ['localStorage', 'sessionStorage', 'indexedDB'].map((property) => ({
  object: 'window',
  property,
  message: 'Прямой доступ к хранилищу разрешён только в src/infrastructure.',
}));

const boundaries = createConfig({
  files: ['src/**/*.{ts,tsx}'],
  settings: {
    ...recommended.settings,
    'boundaries/elements': [
      { type: 'domain', pattern: 'src/domain' },
      { type: 'application', pattern: 'src/application' },
      { type: 'infrastructure', pattern: 'src/infrastructure' },
      { type: 'ui', pattern: 'src/ui' },
      { type: 'app', pattern: 'src/app' },
    ],
  },
  rules: {
    ...recommended.rules,
    'boundaries/no-unknown-files': 'error',
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        policies: [
          { from: { element: { type: 'domain' } }, allow: { to: { element: { type: 'domain' } } } },
          {
            from: { element: { type: 'application' } },
            allow: { to: { element: { types: ['application', 'domain'] } } },
          },
          {
            from: { element: { type: 'infrastructure' } },
            allow: { to: { element: { types: ['infrastructure', 'application', 'domain'] } } },
          },
          {
            from: { element: { type: 'ui' } },
            allow: { to: { element: { types: ['ui', 'application', 'domain'] } } },
          },
          {
            from: { element: { type: 'app' } },
            allow: {
              to: { element: { types: ['ui', 'infrastructure', 'application', 'domain'] } },
            },
          },
        ],
      },
    ],
  },
});

export default tseslint.config(
  { ignores: ['dist', 'android', 'node_modules', 'coverage'] },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  reactHooks.configs.flat['recommended-latest'],

  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // --- Размер и сложность (защита от "файлов-богов") ---
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],

      // --- Типобезопасность ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],

      // --- Запрет плейсхолдеров вместо кода ---
      'no-warning-comments': [
        'error',
        { terms: ['todo', 'fixme', 'xxx', 'rest of code', 'остальной код'], location: 'anywhere' },
      ],

      // --- XSS ---
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML запрещён (XSS).',
        },
        {
          selector: "CallExpression[callee.name='eval']",
          message: 'eval запрещён.',
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-properties': ['error', mathRandomBan],
    },
  },

  // --- Чистые слои: без Date.now, crypto.randomUUID и прямого доступа к хранилищу ---
  {
    files: pureLayers.map((p) => `${p}/*.{ts,tsx}`),
    rules: {
      'no-restricted-properties': [
        'error',
        mathRandomBan,
        dateNowBan,
        randomUuidBan,
        ...windowStorageBans,
      ],
      'no-restricted-globals': [
        'error',
        ...['localStorage', 'sessionStorage', 'indexedDB', 'alert', 'confirm', 'prompt'].map(
          (name) => ({ name, message: 'Недоступно вне src/infrastructure.' }),
        ),
      ],
    },
  },

  // --- Слои без React и без Capacitor ---
  {
    files: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: bannedInReactFreeLayers.map((group) => ({ group: [group] })) },
      ],
    },
  },
  {
    files: ['src/infrastructure/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['react', 'react-dom', 'react-dom/*'] }] },
      ],
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['@capacitor/*'] }] }],
    },
  },

  // Без этого резолвера плагин НЕ видит .ts/.tsx-файлы, считает импорты "unknown"
  // и молча ничего не проверяет (проверено экспериментом: см. DECISIONS.md, п.9).
  {
    files: ['src/**/*.{ts,tsx}'],
    settings: { 'import/resolver': { node: { extensions: ['.ts', '.tsx', '.js', '.json'] } } },
  },
  boundaries,

  // --- Тесты: допускают длинные describe-блоки ---
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },

  // --- Конфиги и JS-файлы: без типовой проверки ---
  {
    files: ['**/*.js', '**/*.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['eslint.config.js'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' },
  },
);
