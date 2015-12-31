'use strict';

var mysql = require('mysql');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');

module.exports = {

  connection: null,
  settings: {
    host: 'localhost',
    database: null,
    user: null,
    password: null,
    sqlPath: null
  },

  init: function(options) {

    // Extend Default Settings
    this.settings = _.extend(this.settings, options);

    // Connection arguments
    this.connection = mysql.createConnection({
      host     : this.settings.host,
      database : this.settings.database,
      user     : this.settings.user,
      password : this.settings.password
    });

    // Configure custom parameter binding
    this.connection.config.queryFormat = function(query, values) {
      if (!values) return query;
      return query.replace(/\:(\w+)/g, function (txt, key) {
        if (values.hasOwnProperty(key)) {
          return this.escape(values[key]);
        }
        return txt;
      }.bind(this));
    };

    // Connect
    this.connection.connect(function(err) {
      if (err) {
        console.error('error connecting: ' + err.stack);
        return;
      }
    });

  },

  /****************************************
  SELECT
  *****************************************/

  select: function(sql, values, next) {

    // overload
    if (typeof(values) == 'function') {
      next = values;
      values = {};
    }

    this.connection.query(sql, values, function(err, rows, fields) {
      if (err) {
        next(err);
      } else {
        next(null, rows, fields)
      }
    });
  },

  selectFile: function(filename, values, next) {

    // overload
    if (typeof(values) == 'function') {
      next = values;
      values = {};
    }

    var _this = this;

    // Get full path
    filename = path.join(_this.settings.sqlPath, filename + (path.extname(filename) == '.sql' ? '' : '.sql'));

    // Read file and execute as SQL statement
    fs.readFile(filename, 'utf8', function(err, sql) {
      if (err) {
        next('Cannot find: ' + err.path);
      } else {
        _this.select(sql, values, next);
      }
    });
  },

  /****************************************
  INSERT / UPDATE
  *****************************************/

  insert: function(table, values, next) {
    var sql = 'INSERT INTO `' + table + '` SET ' + this.getInsertValues(values);
    this.connection.query(sql, function(err, rows, fields) {
      if (err) {
        next(err);
      } else {
        next(null, rows.insertId);
      }
    });
  },

  update: function(table, values, where, next) {
    var sql = 'UPDATE `' + table + '` SET ' + this.getInsertValues(values) + this.sqlWhere(where);
    this.connection.query(sql, function(err, rows, fields) {
      if (err) {
        next(err);
      } else {
        next(null, rows.affectedRows);
      }
    });
  },

  /****************************************
  Helpers
  *****************************************/

  getInsertValues: function(values) {
    var valuesArray = [];
    for (var key in values) {
      valuesArray.push('`' + key + '` = ' + this.connection.escape(values[key]));
    }
    return valuesArray.join();
  },

  sqlWhere: function(where) {
    if (!where) return;
    var whereArray = [];
    for (var key in where) {
      whereArray.push('`' + key + '` = ' + this.connection.escape(where[key]));
    }
    return 'WHERE ' + whereArray.join(' AND ');
  }

}
