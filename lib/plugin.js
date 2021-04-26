const transformWithFilter = require('./transform');
const { createFilter } = require('rollup-pluginutils');

const defaultOptions = {
  include: [],
  exclude: [],
  compiler: {
    debug: false
  }
};

/**
 * @returns { import('vite').Plugin }
 */
function elm(options = {}) {
  const opt = Object.assign({}, defaultOptions, options);
  const filter = createFilter(options.include, options.exclude)
  return {
    handleHotUpdate({ modules }) {
      console.log(modules);
      return Promise.resolve(modules);
    },

    transform(source, id) {
      return transformWithFilter(source, id, opt, filter)
    },
  };
}

module.exports = elm;
