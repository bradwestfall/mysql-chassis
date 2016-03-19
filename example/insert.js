var db = require('./connect');

var insertValues = {first_name: 'Brad', last_name: 'Westfall', datetime_added: 'NOW()'}

db.insert('user', insertValues)
  .then(function(response) {
    console.log('INSERT Response:', response)
  })
  .catch(function(error) {
    console.log('INSERT Error:', error)
  });

// Wait then close the connection to MySQL
setTimeout(function() {
  db.connection.end();
}, 200)
