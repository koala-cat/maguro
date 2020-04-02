import vue from 'rollup-plugin-vue'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

import postcss from 'rollup-plugin-postcss'
import postcssAutoprefixer from 'autoprefixer'
import postcssClean from 'postcss-clean'
import postcssImport from 'postcss-import'
import postcssNested from 'postcss-nested'
import postcssVars from 'postcss-simple-vars'
import postcssUnprefix from 'postcss-unprefix'
import theme from './src/theme'

export default {
  input: 'src/index.js',
  external: ['vue', 'BMap', 'BMapLib', 'a-color-picker'],
  plugins: [
    vue({
      css: false
    }),
    postcss({
      plugins: [
        postcssImport,
        postcssUnprefix,
        postcssVars({variables: theme}),
        postcssNested,
        postcssAutoprefixer,
        postcssClean
      ]
    }),
    resolve({
      mainFields: ['module', 'main', 'browser']
    }),
    babel({
      exclude: 'node_modules/**',
      externalHelpers: true,
      extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.vue']
    }),
    commonjs(),
    terser()
  ],
  onwarn: warning => {
    const { code, plugin, id, input, message, text } = warning
    console.warn('[!]', '[B]', code || warning)
    if (plugin) console.warn('[!]', '...', '[plugin]', plugin)
    if (id) console.warn('[!]', '...', '[id]', id)
    if (input) console.warn('[!]', '...', '[input]', input.file || input)
    if (message) console.warn('[!]', '...', '[message]', message)
    if (text) console.warn('[!]', '...', '[message]', text)
  },
  output: [
    {
      file: 'dist/maguro.min.js',
      format: 'umd',
      name: 'maguro',
      globals: {
        vue: 'Vue',
        BMap: 'BMap',
        BMapLib: 'BMapLib',
        'a-color-picker': 'AColorPicker'
      },
      sourcemap: true
    }
  ]
}
