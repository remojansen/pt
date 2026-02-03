import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	root: 'src',
	publicDir: '../public',
	plugins: [react()],
	build: {
		outDir: '..',
		emptyOutDir: false,
		copyPublicDir: false,
	},
});
