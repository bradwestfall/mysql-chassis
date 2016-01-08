import mysql from 'mysql'
import path from 'path'
import fs from 'fs'

const getInsertValues = (values) => {
  const valuesArray = []

  for (let key in values) {
    valuesArray.push('`' + key + '` = ' + mysql.escape(values[key]))
  }

  return valuesArray.join()
}

const sqlWhere = (where) => {
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
  }

  static queryFormat (query, values) {
    if (!values) {
      return query
    }

    return query.replace(/\:(\w+)/gm, (txt, key) =>
      values.hasOwnProperty(key) ? mysql.escape(values[key]) : txt
    )
  }

  query (sql, ...args) {
    let values

    if (arguments.length > 2) {
      [ values, ...args ] = args
    }

    this.connection.query(MySql.queryFormat(sql, values), ...args)
  }

  select (sql, values = {}) {
    return new Promise((res, rej) => {
      this.query(sql, values, (err, rows, fields = []) => {
        if (err) {
          rej(err)
        } else {
          // add rows directly if it's an array, otherwise assign them in
          res(rows.length ? { ...responseObj, fields, rows } : { ...responseObj, fields, ...rows })
        }
      })
    })
  }

  selectFile (filename, values = {}) {
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
          this.select(sql, values).then(res).catch(rej)
        }
      })
    })
  }

  insert (table, values = {}) {
    const sql = `INSERT INTO \`${table}\` SET ${getInsertValues(values)}`

    return new Promise((res, rej) => {
      this.query(sql, (err, result, fields) => {
        if (err) {
          rej(err)
        } else {
          res(result)
        }
      })
    })
  }

  update (table, values, where) {
    const sql = `UPDATE \`${table}\` SET ${getInsertValues(values)} ${sqlWhere(where)}`

    return new Promise((res, rej) => {
      this.query(sql, (err, result) => {
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
      this.query(sql, (err, result) => {
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
