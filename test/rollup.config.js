import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  input: [
    './test/bin-test.js',
    './test/block-test.js',
    './test/counter-test.js'
  ],
  output: {
    dir: 'test/cjs',
    entryFileNames: '[name].js',
    format: 'cjs'
  },
  external: ['tape'],
  plugins: [nodeResolve(), commonjs()],
  preserveModules: true
}
