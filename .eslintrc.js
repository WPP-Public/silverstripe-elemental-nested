const config = require('@silverstripe/eslint-config/.eslintrc');

module.exports = {
  ...config,
  settings: {
    ...config.settings,
    // Provided as globals by silverstripe/admin at runtime (webpack externals)
    'import/core-modules': [
      'i18n',
      'react-redux',
      'redux-form',
      'lib/Backend',
      'lib/Config',
      'lib/Injector',
      'lib/getJsonErrorMessage',
      'containers/FormBuilderLoader/FormBuilderLoader',
    ],
  },
  overrides: [
    {
      files: ['client/src/tests/**/*.js'],
      env: { jest: true },
    },
  ],
};
