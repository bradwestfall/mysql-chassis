import mysql from 'mysql'
import path from 'path'
import fs from 'fs'

const responseObj = {
  fieldCount: 0,
  affectedRows: 0,
  insertId: 0,
  changedRows: 0,
  rows: [],
  fields: []
}

class MySql {
  constructor (options = { host: 'localhost' }) {
    this.connection = mysql.createConnection(options)
    this.sqlPath = options.sqlPath || './sql'
    this.transforms = options.transforms || {}
  }

  /**
   * Run a SELECT statement
   * @param {string} sql
   * @param {object} values - binding values
   */
  select(sql, values = {}) {
    return this.query(sql, values).then(result => this.limitResults(sql, result.rows))
  }

  /**
   * Run a SELECT statement from a file
   * @param {string} filename
   * @param {object} values - binding values
   */
  selectFile(filename, values = {}) {
    return this.queryFile(filename, values).then(result => this.limitResults(sql, result.rows))
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
   * @param {string} sql
   * @param {object} values - binding values
   */
  query(sql, values = {}) {
    return new Promise((res, rej) => {
      var finalSql = this.queryFormat(sql, values).trim()
      this.connection.query(finalSql, (err, rows, fields = []) => {
        if (err) {
          rej({err, sql: finalSql})
        } else {
          // add rows directly if it's an array, otherwise assign them in
          res(rows.length ? { ...responseObj, fields, rows, sql: finalSql } : { ...responseObj, fields, ...rows, sql: finalSql })
        }
      })
    })
  }

  queryFile(filename, values = {}) {
    // Get full path
    const filePath = path.resolve(path.join(
      this.sqlPath,
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
  queryFormat(query, values) {
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
   * If the values of the "values" argument match the keys of the this.transforms
   * object, then use the transforms value instead of the supplied value
   */
  transformValues(values) {
    const newObj = {}

    for (let key in values) {
      const rawValue = values[key]
      const transform = this.transforms[rawValue]
      let value

      if (this.transforms.hasOwnProperty(rawValue)) {
        value = typeof transform === 'function' ? transform(rawValue, values) : transform
      } else {
        value = mysql.escape(rawValue)
      }

      newObj[key] = value
    }

    return newObj
  }

  limitResults(sql, rows) {
    if (!rows.length) return rows
    let limit = 'LIMIT 1'
    return sql.substr(limit.length * -1).toUpperCase() === limit ? rows[0] : rows
  }

}

export default MySql
