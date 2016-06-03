import mysql from 'mysql'
import path from 'path'
import fs from 'fs'

const defaultConnectionOptions = {
    host: 'localhost',
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
  constructor (options) {
    options = {...defaultConnectionOptions, ...options}
    const {sqlPath, transforms, ...connectionOptions} = options
    this.connection = mysql.createConnection(connectionOptions)
    this.settings = {sqlPath, transforms}
    this.middleware = {
        onBeforeQuery: [],
        onResults: []
    }
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
      values = this.applyMiddlewareOnBeforeQuery(values, originalSql)

      // Bind dynamic values to SQL
      let finalSql = this.queryBindValues(originalSql, values).trim()

      this.connection.query(finalSql, (err, results, fields) => {
        if (err) {
          rej({err, sql: finalSql})
        } else {

          // Apply Middleware
          results = this.applyMiddlewareOnResults(results, originalSql)

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

    // Get full path
    const filePath = path.resolve(path.join(
      this.settings.sqlPath,
      filename + (path.extname(filename) === '.sql' ? '' : '.sql')
    ))

    return new Promise((res, rej) => {
      // Read file and execute as SQL statement
      fs.readFile(filePath, 'utf8', (err, sql) => {
        if (err) {
          rej('Cannot find: ' + err.path)
        } else {
          sql = sql.trim()
          this.query(sql, values).then(res).catch(rej)
        }
      })
    })
  }

  /****************************************
    Helper Functions
  *****************************************/

  /**
   * Turns `SELECT * FROM user WHERE user_id = :user_id`, into
   *       `SELECT * FROM user WHERE user_id = 1`
   */
  queryBindValues(query, values) {
    if (!values) return query

    return query.replace(/\:(\w+)/gm, (txt, key) =>
      values.hasOwnProperty(key) ? mysql.escape(values[key]) : txt
    )
  }

  /**
   * Turns {user_id: 1, age: 30}, into
   *       "WHERE user_id = 1 AND age = 30"
   */
  sqlWhere(where) {
    if (!where) return
    if (typeof where === 'string') return where

    const whereArray = []

    for (let key in where) {
      whereArray.push('`' + key + '` = ' + mysql.escape(where[key]))
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
        value = mysql.escape(rawValue)
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

  applyMiddlewareOnResults(rows, sql) {
    this.middleware.onResults.map(middleware => {
      rows = middleware(rows, sql)
    })
    return rows
  }

  applyMiddlewareOnBeforeQuery(values, sql) {
    this.middleware.onBeforeQuery.map(middleware => {
      values = middleware(values, sql)
    })
    return values
  }

}

export default MySql
