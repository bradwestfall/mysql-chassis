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

class MySql {
  constructor (options = { host: 'localhost' }) {
    this.connection = mysql.createConnection(options)
    this.sqlPath = options.sqlPath || './sql'
  }

  select (sql, values = {}) {
    const _this = this

    return new Promise((res, rej) => {
      _this.connection.query(sql, values, (err, rows, fields) => {
        if (err) {
          rej(err)
        } else {
          res(rows, fields)
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
          res(result.insertId)
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
          res(result.affectedRows)
        }
      })
    })
  }
}

export default MySql
