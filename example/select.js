var db = require('./connect');

/**
 * This example shows how middlware can be used to adjust
 * the results. In this case, it looks for SELECT statements
 * which end in "LIMIT 1" to justify returning only the one
 * result as an object instead of an array of just one result
 *
 * This is an example of how you _can_ write middleware, this
 * particular example isn't built into MySQLChassis so you would
 * have to implement this on your own as middleware
 */

// Middleware
db.onResults(function(rows, sql) {
  if (rows.length !== 1) return rows
  return (sql.match(/^SELECT .+LIMIT 1$/g)) ? rows[0] : rows
})

/**
 * Run an SQL statement with some binding values
 */

var bindValues = {id: 1}

db.select('SELECT * FROM user WHERE user_id = :id LIMIT 1', bindValues)
  .then(function(rows) {
    console.log(rows)
  })
  .catch(function(error) {
    console.error(error)
  });

// Wait then close the connection to MySQL
setTimeout(function() {
  db.connection.end();
}, 200)
