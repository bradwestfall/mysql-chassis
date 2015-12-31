import babel from 'rollup-plugin-babel'

export default {
  entry: 'index.js',
  dest: 'build.js',
  plugins: [ babel() ],
  sourceMap: 'inline',
  format: 'cjs'
}
