import path from 'path';
import elmCompiler from 'node-elm-compiler';
import { createFilter } from 'rollup-pluginutils';
import { Plugin, TransformResult, UserConfig } from 'vite';

type ElmPluginOptions = {
  include?: any[];
  exclude?: any[];
  compiler: {
    debug?: boolean;
  }
};

type ElmModule = {
  entrypoint: string;
  path: string;
};

const defaultOpts: ElmPluginOptions = {
  include: [],
  exclude: [],
  compiler: {
    debug: false,
  },
};

const elmExtensionRE: RegExp = /\.elm$/i;

export default function elm(options: any = {}): Plugin {
  const opts: ElmPluginOptions = Object.assign({}, defaultOpts, options);
  const filter = createFilter(opts.include, opts.exclude);

  const state = {
    config: null as Readonly<UserConfig>,
    elmFiles: new Map<string, ElmModule[]>(),
  };

  return {
    name: 'elm',
    configResolved(config) {
      state.config = config as unknown as Readonly<UserConfig>;
    },
    handleHotUpdate({ file, modules, server }) {
      if (elmExtensionRE.test(file)) {
        const elmFiles = state.elmFiles.get(file) || [];
        const compiledModules = elmFiles.map(({ entrypoint }) => server.moduleGraph.getModuleById(entrypoint));
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
        return compiledModules;
      }
      return modules;
    },
    async transform(_code: string, id: string): Promise<TransformResult> {
      if (!elmExtensionRE.test(id)) return null;
      if (!filter(id)) return null;

      const compiledElm = await compileElmFile(id, opts.compiler);
      const deps: string[] = await elmCompiler.findAllDependencies(id);

      let elmModules = state.elmFiles.get(id);
      if (elmModules == null) {
        elmModules = [];
      }
      let elmModule = elmModules.find(m => m.entrypoint === id);
      if (!elmModule) {
        elmModule = {
          entrypoint: id,
          path: path.posix.normalize(path.relative(state.config.root, id)),
        };
        elmModules.push(elmModule);
      }
      for (const file of [id, ...deps]) {
        state.elmFiles.set(file, elmModules);
      }

      if (this.addWatchFile) {
        deps.forEach(dep => this.addWatchFile(dep));
      }

      const output = {
        code: wrapElmCode(compiledElm),
        map: { mappings: '' },
      };

      return Promise.resolve(output as TransformResult).catch(err => this.error(err))
    },
  }
}

function compileElmFile(file: string, options: any): Promise<string> {
  const outputOptions = {
    output: '.js',
  };
  return elmCompiler.compileToString(
    [file],
    Object.assign({}, options, outputOptions),
  );
}

// This code is copied from 
// https://github.com/ulisses-alves/rollup-plugin-elm/blob/4c1e1a05de1d1d7c7f4535c3362f3853d46892ba/src/index.js
function wrapElmCode(code: string): string {
  return `let output = {}; (function () { ${code} }).call(output); export default output.Elm;`
}
