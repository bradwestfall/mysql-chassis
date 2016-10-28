var db = require('./connect');

var insertValues = {first_name: 'Brad', last_name: 'Westfall', datetime_added: 'NOW()'}

db.insertIgnore('user', insertValues).then(function(response) {
  console.log('INSERT Response:', response)
}).catch(function(error) {
  console.log('INSERT Error:', error)
});
