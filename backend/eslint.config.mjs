import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // Must stay last - turns off any stylistic ESLint rules that would
      // otherwise conflict with Prettier's formatting output.
      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // Express detects error-handling middleware by function arity (must be
      // exactly 4 params: err, req, res, next) - leading-underscore params
      // are intentionally unused (kept only so the arity is correct) and
      // should never be flagged/removed.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
])
