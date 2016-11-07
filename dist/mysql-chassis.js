'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mysql = require('mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultConnectionOptions = {
  password: '',
  sqlPath: './sql',
  transforms: {
    undefined: 'NULL',
    '': 'NULL',
    'NOW()': 'NOW()',
    'CURTIME()': 'CURTIME()'
  }
};

var MySql = function () {

  /**
   * Constructor (runs connection)
   */
  function MySql(options, errCallback) {
    _classCallCheck(this, MySql);

    options = _extends({}, defaultConnectionOptions, options);

    var _options = options,
        sqlPath = _options.sqlPath,
        transforms = _options.transforms,
        connectionOptions = _objectWithoutProperties(_options, ['sqlPath', 'transforms']);

    this.connection = _mysql2.default.createConnection(connectionOptions);
    this.settings = { sqlPath: sqlPath, transforms: transforms };
    this.middleware = {
      onBeforeQuery: [],
      onResults: []
    };
    this.connection.connect(function (err) {
      if (typeof errCallback === 'function' && err) errCallback(err);
    });
  }

  /**
   * Run a SELECT statement
   */


  _createClass(MySql, [{
    key: 'select',
    value: function select(sql) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.query(sql, values).then(function (results) {
        return results.rows;
      });
    }

    /**
     * Run a SELECT statement from a file
     */

  }, {
    key: 'selectFile',
    value: function selectFile(filename) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.queryFile(filename, values).then(function (results) {
        return results.rows;
      });
    }

    /**
     * Build and run a simple SELECT statement from arguments
     */

  }, {
    key: 'selectWhere',
    value: function selectWhere(fields, table, where) {
      where = this.sqlWhere(where);
      if (typeof fields === 'string') fields = fields.split(',');
      if (Array.isArray(fields)) fields = fields.map(function (field) {
        return '`' + field.trim() + '`';
      }).join(', ');
      return this.select('SELECT ' + fields + ' FROM `' + table + '` ' + where);
    }

    /**
     * Build and run an INSERT statement
     */

  }, {
    key: 'insert',
    value: function insert(table) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var sql = 'INSERT INTO `' + table + '` SET ' + this.createInsertValues(values);
      return this.query(sql);
    }

    /**
     * Build and run an UPDATE statement
     */

  }, {
    key: 'update',
    value: function update(table, values, where) {
      var sql = 'UPDATE `' + table + '` SET ' + this.createInsertValues(values) + ' ' + this.sqlWhere(where);
      return this.query(sql);
    }

    /**
     * Try running an INSERT statement. If the record already exists, run an update statement.
     * This takes advantage of MySQL's `ON DUPLICATE KEY UPDATE` feature.
     */

  }, {
    key: 'insertUpdate',
    value: function insertUpdate(table) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      values = this.createInsertValues(values);
      var sql = 'INSERT INTO `' + table + '` SET ' + values + ' ON DUPLICATE KEY UPDATE ' + values;
      return this.query(sql);
    }

    /**
     * Try running an INSERT statement. If the record already exists, ingore the request without error.
     * This takes advantage of MySQL's `INSERT IGNORE` feature.
     */

  }, {
    key: 'insertIgnore',
    value: function insertIgnore(table, values) {
      var sql = 'INSERT IGNORE INTO `' + table + '` SET ' + this.createInsertValues(values);
      return this.query(sql);
    }

    /**
     * Build and run a DELETE statement
     */

  }, {
    key: 'delete',
    value: function _delete(table, where) {
      var sql = 'DELETE FROM `' + table + '` ' + this.sqlWhere(where);
      return this.query(sql);
    }

    /**
     * Prepare and run a query with bound values. Return a promise
     */

  }, {
    key: 'query',
    value: function query(originalSql) {
      var _this = this;

      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return new Promise(function (res, rej) {

        // Apply Middleware
        var finalSql = _this.applyMiddlewareOnBeforeQuery(originalSql, values);

        // Bind dynamic values to SQL
        finalSql = _this.queryBindValues(finalSql, values).trim();

        _this.connection.query(finalSql, function (err, results, fields) {
          if (err) {
            rej({ err: err, sql: finalSql });
          } else {

            // When calling `connection.query`, the results returned are either "rows"
            // in the case of an SQL statement, or meta results in the case of non-SQL

            // Apply Middleware
            results = _this.applyMiddlewareOnResults(originalSql, results);

            // If sql is SELECT
            if (_this.isSelect(finalSql)) {

              // Results is the rows
              res({ rows: results, fields: fields, sql: finalSql });
            } else {
              res(_extends({}, results, { sql: finalSql }));
            }
          }
        });
      });
    }
  }, {
    key: 'queryFile',
    value: function queryFile(filename) {
      var _this2 = this;

      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


      // Get full path
      var filePath = _path2.default.resolve(_path2.default.join(this.settings.sqlPath, filename + (_path2.default.extname(filename) === '.sql' ? '' : '.sql')));

      return new Promise(function (res, rej) {
        // Read file and execute as SQL statement
        _fs2.default.readFile(filePath, 'utf8', function (err, sql) {
          if (err) {
            rej('Cannot find: ' + err.path);
          } else {
            sql = sql.trim();
            _this2.query(sql, values).then(res).catch(rej);
          }
        });
      });
    }

    /****************************************
      Helper Functions
    *****************************************/

    /**
     * Turns 'foo', into
     *       '\'foo\''
     */

  }, {
    key: 'escape',
    value: function escape(content) {
      return _mysql2.default.escape(content);
    }

    /**
     * Turns `SELECT * FROM user WHERE user_id = :user_id`, into
     *       `SELECT * FROM user WHERE user_id = 1`
     */

  }, {
    key: 'queryBindValues',
    value: function queryBindValues(query, values) {
      var _this3 = this;

      if (!values) return query;

      return query.replace(/\:(\w+)/gm, function (txt, key) {
        return values.hasOwnProperty(key) ? _this3.escape(values[key]) : txt;
      });
    }

    /**
     * Turns {user_id: 1, age: null}, into
     *       "WHERE user_id = 1 AND age IS NULL"
     */

  }, {
    key: 'sqlWhere',
    value: function sqlWhere(where) {
      if (!where) return;
      if (typeof where === 'string') return where;

      var whereArray = [];

      for (var key in where) {
        var value = where[key];
        if (value === null) {
          whereArray.push('`' + key + '` IS NULL');
        } else {
          whereArray.push('`' + key + '` = ' + this.escape(value));
        }
      }

      return 'WHERE ' + whereArray.join(' AND ');
    }

    /**
     * Turns {first_name: 'Brad', last_name: 'Westfall'}, into
     *       `first_name` = 'Brad', `last_name` = 'Westfall'
     */

  }, {
    key: 'createInsertValues',
    value: function createInsertValues(values) {
      var valuesArray = [];
      var transformedValues = this.transformValues(values);

      for (var key in transformedValues) {
        var value = transformedValues[key];
        valuesArray.push('`' + key + '` = ' + value);
      }

      return valuesArray.join();
    }

    /**
     * If the argument values match the keys of the this.transforms
     * object, then use the transforms value instead of the supplied value
     */

  }, {
    key: 'transformValues',
    value: function transformValues(values) {
      var newObj = {};

      for (var key in values) {
        var rawValue = values[key];
        var transform = this.settings.transforms[rawValue];
        var value = void 0;

        if (this.settings.transforms.hasOwnProperty(rawValue)) {
          value = typeof transform === 'function' ? transform(rawValue, values) : transform;
        } else {
          value = this.escape(rawValue);
        }

        newObj[key] = value;
      }

      return newObj;
    }
  }, {
    key: 'isSelect',
    value: function isSelect(sql) {
      return sql.trim().toUpperCase().match(/^SELECT/);
    }

    /****************************************
      Middleware
    *****************************************/

  }, {
    key: 'onResults',
    value: function onResults(middleware) {
      if (typeof middleware !== 'function') return;
      this.middleware.onResults.push(middleware);
    }
  }, {
    key: 'onBeforeQuery',
    value: function onBeforeQuery(middleware) {
      if (typeof middleware !== 'function') return;
      this.middleware.onBeforeQuery.push(middleware);
    }
  }, {
    key: 'applyMiddlewareOnResults',
    value: function applyMiddlewareOnResults(sql, results) {
      this.middleware.onResults.map(function (middleware) {
        results = middleware(sql, results);
      });
      return results;
    }
  }, {
    key: 'applyMiddlewareOnBeforeQuery',
    value: function applyMiddlewareOnBeforeQuery(sql, values) {
      this.middleware.onBeforeQuery.map(function (middleware) {
        sql = middleware(sql, values);
      });
      return sql;
    }
  }]);

  return MySql;
}();

exports.default = MySql;
