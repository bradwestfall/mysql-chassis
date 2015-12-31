import babel from 'rollup-plugin-babel'

export default {
  entry: 'index.js',
  dest: 'dist/mysql-chassis.js',
  plugins: [ babel() ],
  sourceMap: 'inline',
  format: 'cjs'
}
