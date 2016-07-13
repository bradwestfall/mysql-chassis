var db = require('./connect');

var bindValues = {id: 1};

db.selectFile('select-users', bindValues).then(function(rows) {
  console.log(rows)
}).catch(function(error) {
  console.error(error)
});
