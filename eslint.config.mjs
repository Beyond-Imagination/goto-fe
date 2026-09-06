import { defineConfig, globalIgnores } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  globalIgnores(['dist/*']),
  expoConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/config/reactotron.ts', 'src/utils/logger.ts'],
    rules: {
      'no-console': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='console'][property.name='tron']",
          message: 'Do not access console.tron directly. Use logger from "@/utils/logger" instead.',
        },
      ],
    },
  },
]);
