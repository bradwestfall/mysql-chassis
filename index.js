import mysql from 'mysql'
import path from 'path'
import fs from 'fs'

const sqlWhere = where => {
  if (!where) return

  const whereArray = []

  for (let key in where) {
    whereArray.push('`' + key + '` = ' + mysql.escape(where[key]))
  }

  return 'WHERE ' + whereArray.join(' AND ')
}

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

  static queryFormat (query, values) {
    if (!values) {
      return query
    }

    return query.replace(/\:(\w+)/gm, (txt, key) =>
      values.hasOwnProperty(key) ? mysql.escape(values[key]) : txt
    )
  }

  transformValues (values) {
    const newObj = {}

    for (let key in values) {
      const rawValue = values[key]
      const transform = this.transforms[rawValue]
      let value

      if (this.transforms.hasOwnProperty(rawValue)) {
        value = typeof transform === 'function' ? transform(rawValue) : transform
      } else {
        value = mysql.escape(rawValue)
      }

      newObj[key] = value
    }

    return newObj
  }

  createInsertValues (values) {
    const valuesArray = []
    const transformedValues = this.transformValues(values)

    for (let key in transformedValues) {
      const value = transformedValues[key]
      valuesArray.push(`\`${key}\` = ${value}`)
    }

    return valuesArray.join()
  }

  sql (sql, ...args) {
    let values

    if (arguments.length > 2) {
      [ values, ...args ] = args
    }

    this.connection.query(MySql.queryFormat(sql, values), ...args)
  }

  query (sql, values = {}) {
    return new Promise((res, rej) => {
      this.sql(sql, values, (err, rows, fields = []) => {
        if (err) {
          rej(err)
        } else {
          // add rows directly if it's an array, otherwise assign them in
          res(rows.length ? { ...responseObj, fields, rows } : { ...responseObj, fields, ...rows })
        }
      })
    })
  }

  queryFile (filename, values = {}) {
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
          sql = sql.replace(/\n*$/m, ' ').replace(/ $/, '')
          this.query(sql, values).then(res).catch(rej)
        }
      })
    })
  }

  select () {
    return this.query(...arguments)
      .then(result => result.rows)
  }

  selectFile () {
    return this.queryFile(...arguments)
      .then(result => result.rows)
  }

  insert (table, values = {}) {
    const sql = `INSERT INTO \`${table}\` SET ${this.createInsertValues(values)}`

    return new Promise((res, rej) => {
      this.sql(sql, (err, result, fields) => {
        if (err) {
          rej(err)
        } else {
          res(result)
        }
      })
    })
  }

  update (table, values, where) {
    const sql = `UPDATE \`${table}\` SET ${this.createInsertValues(values)} ${sqlWhere(where)}`

    return new Promise((res, rej) => {
      this.sql(sql, (err, result) => {
        if (err) {
          rej(err)
        } else {
          res(result)
        }
      })
    })
  }

  delete (table, where) {
    const sql = `DELETE FROM \`${table}\` ${sqlWhere(where)}`

    return new Promise((res, rej) => {
      this.sql(sql, (err, result) => {
        if (err) {
          rej(err)
        } else {
          res(result)
        }
      })
    })
  }
}

export default MySql
