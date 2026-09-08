// PDFZero shipped an `npm run lint` script but no ESLint config, so linting
// simply errored out. This is a minimal flat config for the app's React source.
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // The app uses the modern JSX transform, so React need not be in scope.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Swallowing an error is a deliberate idiom throughout the PDF paths,
      // where a malformed font or resource must not abort the whole export.
      'no-empty': ['error', { allowEmptyCatch: true }],
      // These two are performance/style guidance rather than correctness, and
      // the inherited components trip them in a lot of places. Kept visible as
      // warnings so new code can avoid them without demanding a sweeping
      // refactor of code that works.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  {
    files: ['tests/**/*.{js,mjs}', '*.config.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: { 'no-unused-vars': 'warn' },
  },
]
