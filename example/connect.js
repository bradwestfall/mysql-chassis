/**
 * This example assumes you've created a MySQL database on localhost
 * with a user of "root" and no password. This example also assumes
 * a schema which you can find at ./schema.sql
 */

var MySql = require('../dist/mysql-chassis');

var db = new MySql({
  database: 'mysql-chassis',
  user: 'root'
  // Assuming other default options
});

module.exports = db;