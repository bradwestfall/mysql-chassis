/**
 * This example assumes you've created a MySQL database on localhost
 * called "mysql-chassis" and with a user of "root" and no password.
 * This example also assumes a schema which you can find at ./schema.sql
 */

var MySql = require('../dist/mysql-chassis');
var path = require('path');

// Connect
var db = new MySql({
  database: 'mysql-chassis',
  user: 'root',
  //sqlPath: path.resolve(__dirname, './sql')   // <--- If you want to use the selectFile() method
});

// See if there was a connection error
db.connection.connect(function(err) {
  if (err) {
    console.log(err.message)
  }
})

module.exports = db;
