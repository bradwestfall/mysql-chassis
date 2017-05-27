import MySql from '../src'
import path from 'path'

// Connect
const db = new MySql({
  database: 'mysql-chassis',
  user: 'root',
  sqlPath: path.join(process.cwd(), './example/sql')
}, err => {
  console.error('error connecting: ' + err.stack);
});

// Middleware
db.onResults((sql, results) => {
  if (results.length !== 1) return results
  return /^SELECT\s(.|\n)+LIMIT 1$/g.test(sql.trim()) ? results[0] : results;
});

// Normally we would keep the connection as long as the server is running. But since
// these examples are ran as NPM scripts and not long-running processes, we'll need
// to shut it down. 500ms gives plenty of time for the examples to finish
setTimeout(() => {
  db.connection.end();
}, 500);

export default db
