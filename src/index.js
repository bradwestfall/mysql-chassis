import mysql from 'mysql'
import path from 'path'
import fs from 'fs'

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
    this.connection = mysql.createConnection(connectionOptions)
    this.settings = {sqlPath, transforms}
    this.middleware = {
        onBeforeQuery: [],
        onResults: []
    }
    this.connection.connect(err => {
      if (typeof errCallback === 'function' && err) errCallback(err)
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

      this.connection.query(finalSql, (err, results, fields) => {
        if (err) {
          rej({err, sql: finalSql})
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
    if (!where) return
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
