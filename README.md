vite-plugin-elm
===============

A fork of [`rollup-plugin-elm`](https://github.com/ulisses-alves/rollup-plugin-elm) to support [`vitejs/vite`](https://github.com/vitejs/vite) HMR feature partially.

## Usage

Installation:

```sh
$ npm install -D vite-plugin-elm
```

Configure:

```javascript
// vite.config.js
import elm from "vite-plugin-elm";

export default {
  plugins: [
    elm({
      exclude: "elm-stuff/**",
      compiler: {
        debug: true,
      }
    }),
  ]
};
```

See [example project](https://github.com/lettenj61-examples/vite-example) for more information.


## License

MIT or Apache-2.0