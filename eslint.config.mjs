import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import importX from 'eslint-plugin-import-x';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'android/**',
      '.expo/**',
      'dist/**',
      'dist-test/**',
      // root config files — infra, not source code
      'scripts/build.js',
      'babel.config.js',
      'metro.config.js',
      'knip.config.ts',
      'reactotron.config.ts',
    ],
  },

  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'import-x': importX,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: 'readonly',
      },
    },
    rules: {
      // Hook correctness — catches missing deps, conditional hook calls
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Circular imports — only checks project files, ignores node_modules
      'import-x/no-cycle': ['error', { maxDepth: 5, ignoreExternal: true }],

      // TypeScript — mirrors tsconfig strict settings
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // Relax for __DEV__ require() pattern (Reactotron) and RN internals
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
