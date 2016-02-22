var db = require('./connect');

var bindValues = {user_id: 1}

db.select('SELECT * FROM user WHERE user_id = :user_id LIMIT 1', bindValues)
  .then(function(response) {
    console.log('Response: ', response)
  })
  .catch(function(error) {
    console.error('Error: ', error)
  });

// Wait then close the connection to MySQL
setTimeout(function() {
  db.connection.end();
}, 200)