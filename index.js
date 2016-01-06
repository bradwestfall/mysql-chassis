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

  select (sql, values = {}) {
    const _this = this

    return new Promise((res, rej) => {
      _this.connection.query(sql, values, (err, rows, fields = []) => {
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
    const _this = this

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
          _this.select(sql, values).then(res).catch(rej)
        }
      })
    })
  }

  insert (table, values = {}) {
    const _this = this
    const sql = `INSERT INTO \`${table}\` SET ${getInsertValues(values)}`

    return new Promise((res, rej) => {
      _this.connection.query(sql, (err, result, fields) => {
        if (err) {
          rej(err)
        } else {
          res(result)
        }
      })
    })
  }

  update (table, values, where) {
    const _this = this
    const sql = `UPDATE \`${table}\` SET ${getInsertValues(values)} ${sqlWhere(where)}`

    return new Promise((res, rej) => {
      _this.connection.query(sql, (err, result) => {
        if (err) {
          rej(err)
        } else {
          res(result)
        }
      })
    })
  }

  delete (table, where) {
    const _this = this
    const sql = `DELETE FROM \`${table}\` ${sqlWhere(where)}`

    return new Promise((res, rej) => {
      _this.connection.query(sql, (err, result) => {
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
