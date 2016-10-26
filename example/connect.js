var MySql = require('../dist/mysql-chassis').default;
var path = require('path');

// Connect
var db = new MySql({
  database: 'mysql-chassis',
  user: 'root',
  sqlPath: path.join(process.cwd(), './example/sql')
}, function(err) {
  console.error('error connecting: ' + err.stack);
});

// Middleware
db.onResults(function(sql, results) {
  if (results.length !== 1) return results
  return /^SELECT\s(.|\n)+LIMIT 1$/g.test(sql.trim()) ? results[0] : results;
});

// Normally we would keep the connection as long as the server is running. But since
// these examples are ran as NPM scripts and not long-running processes, we'll need
// to shut it down. 200ms gives plenty of time for the examples to finish
setTimeout(function() {
  db.connection.end();
}, 200);

module.exports = db;
