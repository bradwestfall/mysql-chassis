import mysql from 'mysql'
import path from 'path'
import fs from 'fs'
import { promisify } from './utils'

const defaultConnectionOptions = {
  password: '',
  sqlPath: './sql',
  retryLimit: Infinity,
  connectionLimit: null, // If this is set to a numeric value, the connection will be "pooled"
  transforms: {
    undefined: 'NULL',
    '': 'NULL',
    'NOW()': 'NOW()',
    'CURTIME()': 'CURTIME()'
  }
}

class MySql {

  /****************************************
    Setup and Initialization
  *****************************************/

  constructor(options) {
    options = { ...defaultConnectionOptions, ...options }
    const { sqlPath, retryLimit, transforms, ...connectionOptions } = options
    this.connectionTries = 0
    this.retryLimit = retryLimit

    // Events that can be hooked into
    this.events = {
      connectionAttempt: null,
      connectionSuccess: null,
      connectionError: null,
      connectionLost: null,
      connectionTriesLimitReached: null,
      sqlError: null
    }

    // Misc Setup
    this.settings = { sqlPath, transforms }
    this.middleware = {
      onBeforeQuery: [],
      onResults: []
    }

    // Connect
    const isPool = Number.isInteger(connectionOptions.connectionLimit) && connectionOptions.connectionLimit > 0
    this.connection = this.connect(connectionOptions, isPool)

    // Finish setting up pooling
    if (isPool) this.initPool(connectionOptions)

    // Setup Transactions (after connection)
    this.initTransactions()
  }

  /**
   * Events
   */

  on(eventName, cb) {
    if (typeof eventName !== 'string') throw new Error('You must pass a string value for MySQL Chassis .on() events')
    if (!this.events.hasOwnProperty(eventName)) throw new Error(`MySQL Chassis does not have a db.on('${eventName}') event. If you're trying to access the underlying connection events from MySQLJS, use db.connection.on instead.`)
    this.events[eventName] = cb
  }

  emit(eventName, ...args) {
    if (typeof eventName !== 'string') throw new Error('You must pass a string value for MySQL Chassis .on() events')
    if (!this.events.hasOwnProperty(eventName)) throw new Error(`MySQL Chassis does not have a db.on('${eventName}') event. If you're trying to access the underlying connection events from MySQLJS, use db.connection.on instead.`)
    if (typeof this.events[eventName] !== 'function') return
    this.events[eventName](...args)
  }

  /**
   * MySQL Transactions
   */

  initTransactions() {
    this.transactions = {}
    this.transactions.begin= promisify((options, cb) => this.connection.beginTransaction(options, cb))
    this.transactions.commit = promisify((options, cb) => this.connection.commit(options, cb))
    this.transactions.rollback = promisify((options, cb) => this.connection.rollback(options, cb))
  }


  /**
   * Connect to the database using the underlying MySQLJS lib
   * This method attempts to reconnect when the connection is lost
   */
  connect(connectionOptions, pool = false) {
    this.connectionTries++
    if (this.connectionTries > this.retryLimit) {
      this.emit('connectionTriesLimitReached', this.connectionTries - 1)
      return
    }
    this.emit('connectionAttempt', this.connectionTries)
    if (connectionOptions._connection) return connectionOptions._connection

    // Connection
    const connection = pool ? mysql.createPool(connectionOptions) : mysql.createConnection(connectionOptions)

    // Test initial connection
    connection[pool ? 'getConnection' : 'connect'](err => {
      // This error occurs when we cannot make a connection
      if (err) {
        this.emit('connectionError', err)
        setTimeout(() => {
          this.connect(connectionOptions)
        }, 1000)
      } else {
        this.emit('connectionSuccess', this.connectionTries)
        this.connectionTries = 0
      }
    })

    // This event fires when an established connection is lost
    connection.on('error', err => {
      this.emit('connectionLost', err)
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        this.connect(connectionOptions)
      } else {
        throw err
      }
    })

    return connection
  }

  /**
   *  Initialize Pooling Methods
   */

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

  /****************************************
    SQL
  *****************************************/

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
    if (typeof table !== 'string') throw new Error('selectWhere table argument must be a string')
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
  insertMultiple(table, objects, cols) {
    // If only two arguments are passed, the second argument becomes objects
    // and we will derive `cols` from the first object
    if (cols === undefined) cols = Object.keys(objects[0])

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
    return new Promise((resolve, reject) => {

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
          this.emit('sqlError', err)
          reject(err)
        } else {

          // Apply Middleware
          results = this.applyMiddlewareOnResults(originalSql, results)

          // When calling `connection.query`, the results returned are either "rows"
          // in the case of a SELECT statement, or meta results in the case of non-SELECT

          // If sql is SELECT
          if (this.isSelect(finalSql)) {

            // Results is the rows
            resolve({ rows: results, fields, sql: finalSql})

          } else {
            resolve({ ...results, sql: finalSql })
          }

        }
      })
    })
  }

  queryFile(filename, values = {}) {
    return this.getFile(filename)
      .then(sql => this.query(sql, values))
  }


  /****************************************
    SQL Helper Functions
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
      const value = this.settings.transforms.hasOwnProperty(rawValue)
        ? typeof transform === 'function' ? transform(rawValue, values) : transform
        : this.escape(rawValue)

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
    this.middleware.onResults.forEach(middleware => {
      results = middleware(sql, results)
    })
    return results
  }

  applyMiddlewareOnBeforeQuery(sql, values) {
    this.middleware.onBeforeQuery.forEach(middleware => {
      sql = middleware(sql, values)
    })
    return sql
  }

}

export default MySql
