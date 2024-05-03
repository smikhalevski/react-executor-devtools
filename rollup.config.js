const replace = require('@rollup/plugin-replace');
const nodeResolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');

module.exports = ['content.ts', 'content_main.ts', 'devtools.ts', 'panel.tsx'].map(name => ({
  input: `./src/main/${name}`,
  output: {
    format: 'iife',
    file: `./build/${name.split('.')[0]}.js`,
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.build.json' }),
    replace({
      values: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      preventAssignment: true,
    }),
  ],
}));
