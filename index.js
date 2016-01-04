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

  select (sql, values, next = values) {
    if (typeof values === 'function') {
      values = {}
    }

    this.connection.query(sql, values, (err, rows, fields) => next(err, rows, fields))
  }

  selectFile (filename, values, next = values) {
    if (typeof values === 'function') {
      values = {}
    }

    const _this = this

    // Get full path
    const filePath = path.resolve(path.join(
      this.sqlPath,
      filename + (path.extname(filename) === '.sql' ? '' : '.sql')
    ))

    // Read file and execute as SQL statement
    fs.readFile(filePath, 'utf8', (err, sql) => {
      if (err) {
        next('Cannot find: ' + err.path)
      } else {
        sql = sql.replace(/\n*$/m, ' ').replace(/ $/, '')
        _this.select(sql, values, next)
      }
    })
  }

  insert (table, values, next) {
    const sql = `INSERT INTO \`${table}\` SET ${getInsertValues(values)}`

    this.connection.query(sql, (err, rows, fields) => {
      if (err) {
        next(err)
      } else {
        next(null, rows.insertId)
      }
    })
  }

  update (table, values, where, next) {
    const sql = `UPDATE \`${table}\` SET ${getInsertValues(values)} ${sqlWhere(where)}`

    this.connection.query(sql, (err, rows, fields) => {
      if (err) {
        next(err)
      } else {
        next(null, rows.affectedRows)
      }
    })
  }
}

export default MySql
