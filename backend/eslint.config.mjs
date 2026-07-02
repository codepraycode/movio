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
  },
])
