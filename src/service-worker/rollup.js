const rollup = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonJs = require('rollup-plugin-commonjs');

rollup.rollup({
  input: './src/service-worker/ngsw-worker.js',
  plugins: [
    nodeResolve({jsnext: true, main: true}),
    commonJs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/jshashes/hashes.js': ['SHA1']
      }
    }),
  ],
}).then(bundle => bundle.write({
  format: 'iife',
  file: 'dist/worker-basic.min.js',
}));