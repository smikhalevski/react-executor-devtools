module.exports = {
  typescript: true,
  outDir: './src/main/app/gen/icons',
  jsxRuntime: 'automatic',
  index: false,
  svgProps: {
    role: 'image',
  },
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
          },
        },
      },
    ],
  },
  template(vars, { tpl }) {
    return tpl` import React from 'react';
${vars.imports};

${vars.interfaces};

export const ${vars.componentName.substring(3)} = (${vars.props}) => (
  ${vars.jsx}
);
`;
  },
};
