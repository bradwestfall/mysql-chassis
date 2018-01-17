import MySql from '../src' // Get from src instead of node_modules for testing
import path from 'path'

// Connect. This assumes you have MySQL setup on localhost with no password for the root
// user and with a database name of `mysql-chassis`
const db = new MySql({
  database: 'mysql-chassis',
  user: 'root',
  sqlPath: path.join(process.cwd(), './example/sql')
});

db.on('connectionAttempt', tries => {
  console.log(`MySQL Chassis: Trying to connect. Try: ${tries}`)
});

db.on('connectionSuccess', tries => {
  console.log(`MySQL Chassis: Connection Success. Try: ${tries}`)
});

db.on('connectionError', err => {
  console.error('MySQL Chassis: Could not establish connection. Code:', err.code)
});

db.on('connectionLost', err => {
  console.error('MySQL Chassis: Connection was lost. Code:', err.code)
});

db.on('connectionTriesLimitReached', tries => {
  console.error(`MySQL Chassis: Quit trying to connect after ${tries} tries`)
});

db.on('sqlError', err => {
  console.error(`MySQL Chassis: SQL Error`, { SQL: err.sql, Code: err.code })
});


// Middleware
db.onResults((sql, results) => {
  if (results.length !== 1) return results
  return /^SELECT\s(.|\n)+LIMIT 1$/g.test(sql.trim()) ? results[0] : results;
});


// Normally we would keep the connection as long as the server is running. But since
// these examples are ran as NPM scripts and not long-running processes, we'll need
// to shut it down manually
setTimeout(() => {
  db.connection.destroy();
}, 1000 * 10);

export default db
