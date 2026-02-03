import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
	root: 'src',
	publicDir: '../public',
	plugins: [
		react(),
		VitePWA({
			registerType: 'prompt',
			includeAssets: ['pt.png', 'img/**/*'],
			manifest: {
				name: 'Personal Trainer - Personal Trainer',
				short_name: 'Personal Trainer',
				description:
					'Your personal training companion for tracking workouts, diet, and progress',
				theme_color: '#7c3aed',
				background_color: '#1f2937',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: '/icons/icon-192x192.png',
						sizes: '192x192',
						type: 'image/svg+xml',
					},
					{
						src: '/icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/svg+xml',
					},
					{
						src: '/icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
			devOptions: {
				enabled: true,
			},
		}),
	],
	build: {
		outDir: '..',
		emptyOutDir: false,
		copyPublicDir: false,
	},
});
