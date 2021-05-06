"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const node_elm_compiler_1 = __importDefault(require("node-elm-compiler"));
const rollup_pluginutils_1 = require("rollup-pluginutils");
const defaultOpts = {
    include: [],
    exclude: [],
    compiler: {
        debug: false,
    },
};
const elmExtensionRE = /\.elm$/i;
function elm(options = {}) {
    const opts = Object.assign({}, defaultOpts, options);
    const filter = rollup_pluginutils_1.createFilter(opts.include, opts.exclude);
    const state = {
        config: null,
        elmFiles: new Map(),
    };
    return {
        name: 'elm',
        configResolved(config) {
            state.config = config;
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
        async transform(_code, id) {
            if (!elmExtensionRE.test(id))
                return null;
            if (!filter(id))
                return null;
            const compiledElm = await compileElmFile(id, opts.compiler);
            const deps = await node_elm_compiler_1.default.findAllDependencies(id);
            let elmModules = state.elmFiles.get(id);
            if (elmModules == null) {
                elmModules = [];
            }
            let elmModule = elmModules.find(m => m.entrypoint === id);
            if (!elmModule) {
                elmModule = {
                    entrypoint: id,
                    path: path_1.default.posix.normalize(path_1.default.relative(state.config.root, id)),
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
            return Promise.resolve(output).catch(err => this.error(err));
        },
    };
}
exports.default = elm;
function compileElmFile(file, options) {
    const outputOptions = {
        output: '.js',
    };
    return node_elm_compiler_1.default.compileToString([file], Object.assign({}, options, outputOptions));
}
// This code is copied from 
// https://github.com/ulisses-alves/rollup-plugin-elm/blob/4c1e1a05de1d1d7c7f4535c3362f3853d46892ba/src/index.js
function wrapElmCode(code) {
    return `let output = {}; (function () { ${code} }).call(output); export default output.Elm;`;
}
