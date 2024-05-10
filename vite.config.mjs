import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  return {
    root: command === 'serve' ? './src/main/panel/dev' : './src/main/panel',
    build: {
      minify: false,
      outDir: '../../../build',
      assetsDir: '.',
      emptyOutDir: false,
      modulePreload: {
        polyfill: false,
      },
    },
    resolve: {
      preserveSymlinks: true,
    },
  };
});
