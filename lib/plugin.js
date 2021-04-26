const elmPlugin = require('rollup-plugin-elm');
const { inject } = require('./inject');

/**
 * @returns { import('vite').Plugin }
 */
function viteElmPlugin(options) {
  const elm = elmPlugin(options);
  
  return {
    handleHotUpdate({ modules }) {
      console.log(modules);
      return Promise.resolve(modules);
    },

    async transform(code, id) {
      const outcome = await elm.transform(code, id);
      outcome.code = inject(outcome.code);

      return Promise.resolve(outcome);
    }
  }
}

module.exports = viteElmPlugin;
