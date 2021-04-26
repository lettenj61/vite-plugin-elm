const { inject } = require('./inject');
const elmCompiler = require('node-elm-compiler');

module.exports = function transformWithFilter(source, id, opt, filter) {
  if (!/.elm$/i.test(id)) return null;
  if (!filter(id)) return null;

  const transform_ = async (source, id, options) => {
    const elm = await compile(id, options.compiler);
    const dependencies = await elmCompiler.findAllDependencies(id);
    const compiled = {
      code: wrapElmCode(elm),
      map: { mappings: '' },
    };

    if (this.addWatchFile) {
      dependencies.forEach(this.addWatchFile);
    } else {
      compiled.dependencies = dependencies;
    }

    return compiled;
  };

  return transform_(source, id, opt).catch(err => this.error(err));
};

async function compile(filename, options) {
  const compilerOptions = {
    output: '.js',
  };

  return await elmCompiler.compileToString(
    [filename],
    Object.assign({}, options, compilerOptions)
  );
}

function wrapElmCode(code) {
  return `let output = {}; (function () { ${inject(code)} }).call(output); export default output.Elm;`;
}
