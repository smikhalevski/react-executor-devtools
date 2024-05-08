import { defineConfig } from 'vite';

export default defineConfig({
  root: './src/main/panel',
  build: {
    minify: false
  },
  resolve: {
    preserveSymlinks: true
  }
});
