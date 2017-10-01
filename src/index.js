import mysql from 'mysql'
import path from 'path'
import fs from 'fs'
import { promisify } from './utils'

const defaultConnectionOptions = {
  password: '',
  sqlPath: './sql',
  transforms: {
    undefined: 'NULL',
    '': 'NULL',
    'NOW()': 'NOW()',
    'CURTIME()': 'CURTIME()'
  }
}

class MySql {

  /**
   * Constructor (runs connection)
   */
  constructor (options, errCallback) {
    options = {...defaultConnectionOptions, ...options}
    const {sqlPath, transforms, ...connectionOptions} = options
    this.connection = this.connect(connectionOptions)
    this.settings = {sqlPath, transforms}
    this.middleware = {
      onBeforeQuery: [],
      onResults: []
    }

    this.testConnection(errCallback)

    this.initTransactions()
    this.initPool(connectionOptions)
    this.exposeMethods()
  }

  /**
   * Connects to mysql using provided options.
   *
   * Connection can be
   *  1. regular (non-pooled) - 'createConnection'
   *  2. pool connection instance - 'createPool'. It
   *    has a `getConnection` method that returns a
   *    connection.
   *  3. pool connection - connection that is returned
   *    from pool.getConnection (2). This connection
   *    is raw mysqljs connection (1) but it
   *    needs to be chassis-ified
   *
   * @param      {Object}  connectionOptions  The connection options
   * @return     {Object}  The mysql connection
   */
  connect(connectionOptions) {
    if (connectionOptions._connection) {
      return connectionOptions._connection
    }

    // check if it is pool. only interested in truthiness,
    // error handling is on the mysqljs side if the value is
    // not a number
    const isPool = !!connectionOptions.connectionLimit

    return mysql[isPool ? 'createPool' : 'createConnection'](connectionOptions)
  }

  /**
   * Tests the connections.
   * Uses either `connect` (non-pooled) connection or
   * `getConnection` if it is a pool connection.
   * Executes user-defined callback if exists.
   * Releases the pool connection if there is one
   * and there is no error.
   *
   * @param      {Function}  cb      { err - mysqljs connection error }
   */
  testConnection(cb) {
    const isPool = !!this.connection.getConnection
    this.connection[isPool ? 'getConnection' : 'connect']((err, connection) => {
      // execute the err callback if there is an err
      if (typeof errCallback === 'function' && err) return errCallback(err)
      if (connection && connection.release) connection.release()
    })
  }

  /**
   * Run a SELECT statement
   */
  select(sql, values = {}) {
    return this.query(sql, values).then(results => results.rows)
  }

  /**
   * Run a SELECT statement from a file
   */
  selectFile(filename, values = {}) {
    return this.queryFile(filename, values).then(results => results.rows)
  }

  /**
   * Build and run a simple SELECT statement from arguments
   */
  selectWhere(fields, table, where) {
    where = this.sqlWhere(where)
    if (typeof fields === 'string') fields = fields.split(',')
    if (Array.isArray(fields)) fields = fields.map(field => '`' + field.trim() + '`').join(', ')
    return this.select(`SELECT ${fields} FROM \`${table}\` ${where}`)
  }

  /**
   * Build and run an INSERT statement
   */
  insert(table, values = {}) {
    const sql = `INSERT INTO \`${table}\` SET ${this.createInsertValues(values)}`
    return this.query(sql)
  }

  /**
   * Build and run an UPDATE statement
   */
  update(table, values, where) {
    const sql = `UPDATE \`${table}\` SET ${this.createInsertValues(values)} ${this.sqlWhere(where)}`
    return this.query(sql)
  }

  /**
   * Try running an INSERT statement. If the record already exists, run an update statement.
   * This takes advantage of MySQL's `ON DUPLICATE KEY UPDATE` feature.
   */
  insertUpdate(table, values = {}) {
    values = this.createInsertValues(values)
    const sql = `INSERT INTO \`${table}\` SET ${values} ON DUPLICATE KEY UPDATE ${values}`
    return this.query(sql)
  }

  /**
   * Try running an INSERT statement. If the record already exists, ingore the request without error.
   * This takes advantage of MySQL's `INSERT IGNORE` feature.
   */
  insertIgnore(table, values) {
    const sql = `INSERT IGNORE INTO \`${table}\` SET ${this.createInsertValues(values)}`
    return this.query(sql)
  }

  /**
   * Insert multiple values in one statement. This method creates an sql statement similar to:
   *  INSERT INTO table
   *    (a,b,c)
   *  VALUES
   *    (1,2,3),
   *    (4,5,6),
   *    (7,8,9);
   */
  insertMultiple(table, cols, objects) {
    // If only two arguments are passed, the second argument becomes objects
    // and we will derive `cols` from the first object
    if (objects === undefined) {
      objects = cols
      cols = Object.keys(objects[0])
    }

    const values = objects.map(obj => {
      const uniformObj = []
      obj = this.transformValues(obj)
      cols.forEach(col => {
        uniformObj.push(obj[col] || 'null')
      })
      return `(${uniformObj.join(',')})`
    })

    const sql = `INSERT INTO \`${table}\` (\`${cols.join('`,`')}\`) VALUES ${values.join(',')}`
    return this.query(sql)
  }

  /**
   * Build and run a DELETE statement
   */
  delete(table, where) {
    const sql = `DELETE FROM \`${table}\` ${this.sqlWhere(where)}`
    return this.query(sql)
  }

  /**
   * Prepare and run a query with bound values. Return a promise
   */
  query(originalSql, values = {}) {
    return new Promise((res, rej) => {

      // Apply Middleware
      let finalSql = this.applyMiddlewareOnBeforeQuery(originalSql, values)

      // Bind dynamic values to SQL
      finalSql = this.queryBindValues(finalSql, values).trim()

      this.connection.query({
        sql: finalSql,
        typeCast: (field, next) => field.type === 'JSON' ? JSON.parse(field.string()) : next()
      }, (err, results, fields) => {
        if (err) {
          // assign `sql` and preserve `message` prop
          err.sql = finalSql

          rej(err)
        } else {

          // When calling `connection.query`, the results returned are either "rows"
          // in the case of an SQL statement, or meta results in the case of non-SQL

          // Apply Middleware
          results = this.applyMiddlewareOnResults(originalSql, results)

          // If sql is SELECT
          if (this.isSelect(finalSql)) {

            // Results is the rows
            res({ rows: results, fields, sql: finalSql})

          } else {
            res({ ...results, sql: finalSql })
          }

        }
      })
    })
  }

  queryFile(filename, values = {}) {
    return this.getFile(filename)
      .then(sql => this.query(sql, values))
  }

  initTransactions() {
    this.beginTransaction = promisify((options, cb) => this.connection.beginTransaction(options, cb))
    this.commit = promisify((options, cb) => this.connection.commit(options, cb))
    this.rollback = promisify((options, cb) => this.connection.rollback(options, cb))
  }

  initPool(connectionOptions) {
    this.getConnection = (cb) => {
      return this.connection.getConnection((err, connection) => {
        if (err) return cb(err)
        const chassisified = connection && new MySql({
          ...connectionOptions,
          _connection: connection
        })

        if (!chassisified) return cb(new Error('Could not return new connection'))

        return cb(null, chassisified)
      })
    }

    if (this.connection.release) {
      // has no callback, no need to be promisified
      this.release = this.connection.release.bind(this.connection)
    }
  }

  exposeMethods() {
    this.end = promisify(cb => this.connection.end(cb))

    // on('event') method does not make sense to be promisified
    this.on = this.connection.on.bind(this.connection)
  }

  /****************************************
    Helper Functions
  *****************************************/

  /**
   * Get File
   */
  getFile(filename) {

    // Get full path
    const filePath = path.resolve(path.join(
      this.settings.sqlPath,
      filename + (path.extname(filename) === '.sql' ? '' : '.sql')
    ))

    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, sql) => {
        if (err) {
          reject('Cannot find: ' + err.path)
        } else {
          resolve(sql.trim())
        }
      })
    })

  }

  /**
   * Turns 'foo', into
   *       '\'foo\''
   */
  escape(content) {
    return mysql.escape(content)
  }

  /**
   * Turns `SELECT * FROM user WHERE user_id = :user_id`, into
   *       `SELECT * FROM user WHERE user_id = 1`
   */
  queryBindValues(query, values) {
    if (!values) return query

    return query.replace(/\:(\w+)/gm, (txt, key) =>
      values.hasOwnProperty(key) ? this.escape(values[key]) : txt
    )
  }

  /**
   * Turns {user_id: 1, age: null}, into
   *       "WHERE user_id = 1 AND age IS NULL"
   */
  sqlWhere(where) {
    if (!where) return ''
    if (typeof where === 'string') return where

    const whereArray = []

    for (let key in where) {
      let value = where[key]
      if (value === null) {
        whereArray.push('`' + key + '` IS NULL')
      } else {
        whereArray.push('`' + key + '` = ' + this.escape(value))
      }
    }

    return 'WHERE ' + whereArray.join(' AND ')
  }

  /**
   * Turns {first_name: 'Brad', last_name: 'Westfall'}, into
   *       `first_name` = 'Brad', `last_name` = 'Westfall'
   */
  createInsertValues(values) {
    const valuesArray = []
    const transformedValues = this.transformValues(values)

    for (let key in transformedValues) {
      const value = transformedValues[key]
      valuesArray.push(`\`${key}\` = ${value}`)
    }

    return valuesArray.join()
  }

  /**
   * If the argument values match the keys of the this.transforms
   * object, then use the transforms value instead of the supplied value
   */
  transformValues(values) {
    const newObj = {}

    for (let key in values) {
      const rawValue = values[key]
      const transform = this.settings.transforms[rawValue]
      let value

      if (this.settings.transforms.hasOwnProperty(rawValue)) {
        value = typeof transform === 'function' ? transform(rawValue, values) : transform
      } else {
        value = this.escape(rawValue)
      }

      newObj[key] = value
    }

    return newObj
  }

  isSelect(sql) {
    return sql.trim().toUpperCase().match(/^SELECT/)
  }


  /****************************************
    Middleware
  *****************************************/

  onResults(middleware) {
    if (typeof middleware !== 'function') return
    this.middleware.onResults.push(middleware)
  }

  onBeforeQuery(middleware) {
    if (typeof middleware !== 'function') return
    this.middleware.onBeforeQuery.push(middleware)
  }

  applyMiddlewareOnResults(sql, results) {
    this.middleware.onResults.map(middleware => {
      results = middleware(sql, results)
    })
    return results
  }

  applyMiddlewareOnBeforeQuery(sql, values) {
    this.middleware.onBeforeQuery.map(middleware => {
      sql = middleware(sql, values)
    })
    return sql
  }

}

export default MySql
