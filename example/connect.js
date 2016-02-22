/**
 * This example assumes you've created a MySQL database on localhost
 * with a user of "root" and no password. This example also assumes
 * a schema which you can find at ./schema.sql
 */

var MySql = require('../dist/mysql-chassis');

var db = new MySql({
  host: 'localhost',
  database: 'mysql-chassis',
  user: 'root',
  password: '',
  transforms: {
    undefined: 'NULL',
    '': 'NULL',
    'NOW()': 'NOW()'
  }
});

module.exports = db;