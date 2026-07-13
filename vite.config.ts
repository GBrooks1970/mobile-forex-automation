import { defineConfig } from 'vite';

// Local development and Playwright preview run at `/`. The Pages workflow
// supplies the repository sub-path so emitted asset URLs work at the public URL.
export default defineConfig({
  base: process.env['VITE_BASE_PATH'] ?? '/',
});
