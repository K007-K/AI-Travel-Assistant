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
                // Portfolio mode: core engines tested at >80%;
                // UI/store layer not unit-tested (normal for React apps).
                lines: 40,
                branches: 30,
            },
        },
    },
});
