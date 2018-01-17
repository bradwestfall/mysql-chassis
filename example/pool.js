import MySql from '../src'
import path from 'path'

// Connect
const pool = new MySql({
  database: 'mysql-chassis',
  user: 'root',
  sqlPath: path.join(process.cwd(), './example/sql'),
  connectionLimit: 10
});

// Middleware
pool.onResults((sql, results) => {
  console.log('RESULTS', results)
  if (results && results.length !== 1) return results
  return /^SELECT\s(.|\n)+LIMIT 1$/g.test(sql.trim()) ? results[0] : results;
});

pool.getConnection((err, connection) => {
  connection.select('SELECT * FROM user')
    .then(rows => {
      console.log('Rows: ', rows)
      return connection.release();
    })
    .then(() => {
      pool.connection.end()
      console.log('all pool connections have ended!')
      process.exit()
    })
    .catch(err => {
      console.log('err', err)
      process.exit()
    })
})

export default pool
