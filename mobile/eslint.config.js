// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // This rule rejects calling anything that sets state from an effect body.
      // Every screen here loads data on the client, and doing that in an effect
      // is the documented React pattern for it: the screens read from Supabase
      // after mount rather than during render. The rule has no autofix for this
      // shape, and the alternative would be pulling in a data-fetching library,
      // which this project deliberately avoids.
      //
      // exhaustive-deps stays on, because a stale closure there is a real bug.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);