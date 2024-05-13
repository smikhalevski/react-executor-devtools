import { defineConfig } from 'vite';

export default defineConfig(env => {
  return {
    root: './src/main',
    build: {
      minify: false,
      outDir: '../../build',
      assetsDir: '.',
      emptyOutDir: false,
      modulePreload: {
        polyfill: false,
      },
    },
    resolve: {
      preserveSymlinks: true,
      alias: [{ find: /panel\.tsx$/, replacement: env.command === 'serve' ? 'panel.dev.tsx' : 'panel.tsx' }],
    },
  };
});
