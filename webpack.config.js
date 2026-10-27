const Path = require('path');
const { JavascriptWebpackConfig, CssWebpackConfig } = require('@silverstripe/webpack-config');

const PATHS = {
  ROOT: Path.resolve(),
  SRC: Path.resolve('client/src'),
  DIST: Path.resolve('client/dist'),
};

const adminSrc = Path.resolve('vendor/silverstripe/admin/client/src');
const elementalSrc = Path.resolve('vendor/dnadesign/silverstripe-elemental/client/src');

const addResolvePaths = (webpackConfig) => {
  webpackConfig.resolve = webpackConfig.resolve || {};
  webpackConfig.resolve.modules = [
    PATHS.SRC,
    adminSrc,
    elementalSrc,
    Path.resolve('node_modules'),
    ...(webpackConfig.resolve.modules || []),
  ];
  return webpackConfig;
};

const config = [
  addResolvePaths(
    new JavascriptWebpackConfig('js', PATHS, 'akqa-nz/silverstripe-elemental-nested')
      .setEntry({
        bundle: `${PATHS.SRC}/bundles/bundle.js`,
      })
      .getConfig()
  ),
  new CssWebpackConfig('css', PATHS)
    .setEntry({
      bundle: `${PATHS.SRC}/styles/bundle.scss`,
    })
    .getConfig(),
];

module.exports = (process.env.WEBPACK_CHILD)
  ? config.find((entry) => entry.name === process.env.WEBPACK_CHILD)
  : config;
