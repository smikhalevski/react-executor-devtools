const nodeResolve = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');

module.exports = ['content', 'content_main'].map(name => ({
  input: `./src/main/${name}.ts`,
  output: {
    format: 'iife',
    file: `./build/${name}.js`,
  },
  plugins: [nodeResolve(), typescript({ tsconfig: './tsconfig.build.json' })],
  preserveSymlinks: true,
}));
