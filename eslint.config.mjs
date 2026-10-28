import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import nodePlugin from 'eslint-plugin-n';
import stylistic from '@stylistic/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

// Build scripts: the builder (scripts/) and every module's scripts/ tree that
// it discovers tasks.js in. Must stay in sync with tsconfig.scripts.json,
// which backs the type-aware rules below.
const BUILD_SCRIPTS = ['**/scripts/**/*.{js,cjs,mjs}'];

export default tseslint.config(
	// Global ignores
	{
		// scripts/assets/ holds files packaged as-is (the shell stub), not build code
		ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/*.min.js', '**/coverage/**', '**/.storybook/**', '**/storybook-static/**', 'apps/vscode/rocketride.js', 'packages/n8n-nodes/**', 'scripts/assets/**'],
	},

	// Base config for all files
	js.configs.recommended,

	// TypeScript files
	...tseslint.configs.recommended,

	// React configuration for JSX/TSX files
	{
		files: ['**/*.{jsx,tsx}'],
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
			'react-refresh': reactRefreshPlugin,
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				...globals.browser,
			},
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			// React rules
			'react/react-in-jsx-scope': 'off', // Not needed with React 17+
			'react/prop-types': 'off', // Using TypeScript
			'react/display-name': 'off',

			// React Hooks rules
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',

			// React Refresh rules
			'react-refresh/only-export-components': 'off',
		},
	},

	// TypeScript-specific rules
	{
		files: ['**/*.{ts,tsx}'],
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-require-imports': 'off',
		},
	},

	// Node.js scripts
	{
		files: ['scripts/**/*.{js,mjs,cjs}', '**/scripts/**/*.{js,mjs,cjs}', '**/esbuild.js'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
		},
	},

	// Build scripts — stricter than the block above: mistakes here break the
	// build for everyone, and the worst ones (an un-awaited step, a require
	// that no longer resolves) pass silently until they don't.
	// No package with a scripts/ tree sets "type": "module", so .js is CommonJS.
	{
		files: ['**/scripts/**/*.js'],
		languageOptions: {
			sourceType: 'commonjs',
		},
	},
	{
		files: BUILD_SCRIPTS,
		plugins: {
			n: nodePlugin,
		},
		languageOptions: {
			ecmaVersion: 2022,
			parserOptions: {
				project: './tsconfig.scripts.json',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			// Async steps: a promise nobody awaits lets the next step start
			// before this one finishes
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/await-thenable': 'error',

			// Module resolution and Node APIs. Not no-extraneous-*: build scripts
			// run under the root package, so its devDependencies (glob, dotenv,
			// typescript) are theirs whatever the nearest package.json declares.
			// For the same reason the Node version is the root engines range,
			// not each package's own.
			'n/no-missing-require': 'error',
			'n/no-missing-import': 'error',
			// test.describe: the plugin dates it to 20.13, but node:test has
			// exported describe since 18
			'n/no-unsupported-features/node-builtins': ['error', { version: '>=20.0.0', allowExperimental: true, ignores: ['test.describe'] }],
			'n/no-deprecated-api': 'error',

			// Plain JS: the core rule, not the TypeScript one
			'@typescript-eslint/no-unused-vars': 'off',
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrors: 'none',
				},
			],
			// `const crypto = require('crypto')` is not a redeclaration worth flagging
			'no-redeclare': ['error', { builtinGlobals: false }],
			'no-empty': ['error', { allowEmptyCatch: true }],
			eqeqeq: ['error', 'smart'],
			'prefer-const': 'error',
		},;
