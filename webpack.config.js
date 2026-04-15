const path = require('path');

module.exports = function (options) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      extensionAlias: {
        '.js': ['.ts', '.js'],
      },
      alias: {
        ...options.resolve.alias,
        '@app/common': path.resolve(__dirname, 'libs/common/src/index.ts'),
      }
    },
    // Without workspaces, @app/common is no longer in node_modules,
    // so Webpack will follow the alias and bundle it as source code.
  };
};
