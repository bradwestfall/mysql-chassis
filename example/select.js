var db = require('./connect');

/**
 * Create some middleware. This middleware forces the return of a
 * single object instead of an array of one object in the case
 * that the SQL statement starts with SELECT and ends with LIMIT 1.
 * The idea being that if we write our query with LIMIT 1 at the
 * end, why should we have to deal with receiving an array with
 * our one row? Why not just receive the row object.
 *
 * This is an example of how you _can_ write middleware, this 
 * particular one isn't built into MySQLChassis so you would
 * have to implement this on your own 
 */

db.use('ON_RESULTS', function(args) {
    var sql = args[0]
    var rows = args[1]

    if (rows.length !== 1) return args
    return (sql.match(/^SELECT .+LIMIT 1$/g)) ? [sql, rows[0]] : args
})

/**
 * Run an SQL statement with some binding values
 */

var bindValues = {id: 1}

db.select('SELECT * FROM user WHERE user_id = :id LIMIT 1', bindValues)
  .then(function(row) {
    console.log('Row: ', row)
  })
  .catch(function(error) {
    console.error('Error: ', error)
  });

// Wait then close the connection to MySQL
setTimeout(function() {
  db.connection.end();
}, 200)