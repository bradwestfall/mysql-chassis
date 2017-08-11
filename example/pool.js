import MySql from '../src'
import path from 'path'

// Connect
const pool = new MySql({
  database: 'mysql-chassis',
  user: 'root',
  sqlPath: path.join(process.cwd(), './example/sql'),
  connectionLimit: 10
}, err => {
  console.error('error connecting: ' + err.stack);
});

pool.on('acquire', function (connection) {
  console.log('Connection %d acquired', connection.threadId)
})

pool.on('enqueue', function () {
  console.log('Waiting for available connection slot')
})

pool.on('release', function (connection) {
  console.log('Connection %d released', connection.threadId)
})

// Middleware
pool.onResults((sql, results) => {
  if (results.length !== 1) return results
  return /^SELECT\s(.|\n)+LIMIT 1$/g.test(sql.trim()) ? results[0] : results;
});

pool.getConnection((err, connection) => {
  connection.select('SELECT * FROM user')
    .then(rows => {
      console.log('Rows: ', rows)
      return connection.release();
    })
    .then(_ => pool.end)
    .then(_ => {
        console.log('all pool connections have ended!')
        process.exit()
    })
    .catch(err => {
      console.log('err', err)
      process.exit()
    })
})

export default pool
