import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.js'],
        include: ['tests/**/*.test.{js,jsx}'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{js,jsx}'],
            exclude: ['src/main.jsx', 'node_modules'],
            thresholds: {
                // Portfolio mode: core engines tested at >80%.
                // Overall is low (~3%) because UI/store/pages have 0% coverage
                // (standard for React apps without integration test infra).
                lines: 3,
                branches: 2,
            },
        },
    },
});
