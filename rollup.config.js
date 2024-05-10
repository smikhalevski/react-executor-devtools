const nodeResolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');

module.exports = ['content', 'content_main', 'devtools'].map(name => ({
  input: `./src/main/${name}.ts`,
  output: {
    format: 'iife',
    file: `./build/${name}.js`,
  },
  plugins: [nodeResolve(), commonjs(), typescript({ tsconfig: './tsconfig.build.json' })],
  preserveSymlinks: true,
}));
