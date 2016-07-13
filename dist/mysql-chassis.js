'use strict';

var mysql = require('mysql');
mysql = 'default' in mysql ? mysql['default'] : mysql;
var path = require('path');
path = 'default' in path ? path['default'] : path;
var fs = require('fs');
fs = 'default' in fs ? fs['default'] : fs;

var babelHelpers = {};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

babelHelpers.extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

babelHelpers.objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

babelHelpers;

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
    babelHelpers.classCallCheck(this, MySql);

    options = babelHelpers.extends({}, defaultConnectionOptions, options);
    var _options = options;
    var sqlPath = _options.sqlPath;
    var transforms = _options.transforms;
    var connectionOptions = babelHelpers.objectWithoutProperties(_options, ['sqlPath', 'transforms']);

    this.connection = mysql.createConnection(connectionOptions);
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


  babelHelpers.createClass(MySql, [{
    key: 'select',
    value: function select(sql) {
      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.queryFile(filename, values).then(function (results) {
        return results.rows;
      });
    }

    /**
     * Build and run an INSERT statement
     */

  }, {
    key: 'insert',
    value: function insert(table) {
      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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

      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
              res(babelHelpers.extends({}, results, { sql: finalSql }));
            }
          }
        });
      });
    }
  }, {
    key: 'queryFile',
    value: function queryFile(filename) {
      var _this2 = this;

      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];


      // Get full path
      var filePath = path.resolve(path.join(this.settings.sqlPath, filename + (path.extname(filename) === '.sql' ? '' : '.sql')));

      return new Promise(function (res, rej) {
        // Read file and execute as SQL statement
        fs.readFile(filePath, 'utf8', function (err, sql) {
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
     * Turns `SELECT * FROM user WHERE user_id = :user_id`, into
     *       `SELECT * FROM user WHERE user_id = 1`
     */

  }, {
    key: 'queryBindValues',
    value: function queryBindValues(query, values) {
      if (!values) return query;

      return query.replace(/\:(\w+)/gm, function (txt, key) {
        return values.hasOwnProperty(key) ? mysql.escape(values[key]) : txt;
      });
    }

    /**
     * Turns {user_id: 1, age: 30}, into
     *       "WHERE user_id = 1 AND age = 30"
     */

  }, {
    key: 'sqlWhere',
    value: function sqlWhere(where) {
      if (!where) return;
      if (typeof where === 'string') return where;

      var whereArray = [];

      for (var key in where) {
        whereArray.push('`' + key + '` = ' + mysql.escape(where[key]));
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
        var value = undefined;

        if (this.settings.transforms.hasOwnProperty(rawValue)) {
          value = typeof transform === 'function' ? transform(rawValue, values) : transform;
        } else {
          value = mysql.escape(rawValue);
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

module.exports = MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5qcyIsInNvdXJjZXMiOlsiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuY29uc3QgZGVmYXVsdENvbm5lY3Rpb25PcHRpb25zID0ge1xuICBwYXNzd29yZDogJycsXG4gIHNxbFBhdGg6ICcuL3NxbCcsXG4gIHRyYW5zZm9ybXM6IHtcbiAgICB1bmRlZmluZWQ6ICdOVUxMJyxcbiAgICAnJzogJ05VTEwnLFxuICAgICdOT1coKSc6ICdOT1coKScsXG4gICAgJ0NVUlRJTUUoKSc6ICdDVVJUSU1FKCknXG4gIH1cbn1cblxuY2xhc3MgTXlTcWwge1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciAocnVucyBjb25uZWN0aW9uKVxuICAgKi9cbiAgY29uc3RydWN0b3IgKG9wdGlvbnMsIGVyckNhbGxiYWNrKSB7XG4gICAgb3B0aW9ucyA9IHsuLi5kZWZhdWx0Q29ubmVjdGlvbk9wdGlvbnMsIC4uLm9wdGlvbnN9XG4gICAgY29uc3Qge3NxbFBhdGgsIHRyYW5zZm9ybXMsIC4uLmNvbm5lY3Rpb25PcHRpb25zfSA9IG9wdGlvbnNcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBteXNxbC5jcmVhdGVDb25uZWN0aW9uKGNvbm5lY3Rpb25PcHRpb25zKVxuICAgIHRoaXMuc2V0dGluZ3MgPSB7c3FsUGF0aCwgdHJhbnNmb3Jtc31cbiAgICB0aGlzLm1pZGRsZXdhcmUgPSB7XG4gICAgICAgIG9uQmVmb3JlUXVlcnk6IFtdLFxuICAgICAgICBvblJlc3VsdHM6IFtdXG4gICAgfVxuICAgIHRoaXMuY29ubmVjdGlvbi5jb25uZWN0KGVyciA9PiB7XG4gICAgICBpZiAodHlwZW9mIGVyckNhbGxiYWNrID09PSAnZnVuY3Rpb24nICYmIGVycikgZXJyQ2FsbGJhY2soZXJyKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudFxuICAgKi9cbiAgc2VsZWN0KHNxbCwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwsIHZhbHVlcykudGhlbihyZXN1bHRzID0+IHJlc3VsdHMucm93cylcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBTRUxFQ1Qgc3RhdGVtZW50IGZyb20gYSBmaWxlXG4gICAqL1xuICBzZWxlY3RGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5RmlsZShmaWxlbmFtZSwgdmFsdWVzKS50aGVuKHJlc3VsdHMgPT4gcmVzdWx0cy5yb3dzKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYW4gSU5TRVJUIHN0YXRlbWVudFxuICAgKi9cbiAgaW5zZXJ0KHRhYmxlLCB2YWx1ZXMgPSB7fSkge1xuICAgIGNvbnN0IHNxbCA9IGBJTlNFUlQgSU5UTyBcXGAke3RhYmxlfVxcYCBTRVQgJHt0aGlzLmNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhbiBVUERBVEUgc3RhdGVtZW50XG4gICAqL1xuICB1cGRhdGUodGFibGUsIHZhbHVlcywgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgVVBEQVRFIFxcYCR7dGFibGV9XFxgIFNFVCAke3RoaXMuY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcyl9ICR7dGhpcy5zcWxXaGVyZSh3aGVyZSl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGEgREVMRVRFIHN0YXRlbWVudFxuICAgKi9cbiAgZGVsZXRlKHRhYmxlLCB3aGVyZSkge1xuICAgIGNvbnN0IHNxbCA9IGBERUxFVEUgRlJPTSBcXGAke3RhYmxlfVxcYCAke3RoaXMuc3FsV2hlcmUod2hlcmUpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogUHJlcGFyZSBhbmQgcnVuIGEgcXVlcnkgd2l0aCBib3VuZCB2YWx1ZXMuIFJldHVybiBhIHByb21pc2VcbiAgICovXG4gIHF1ZXJ5KG9yaWdpbmFsU3FsLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcblxuICAgICAgLy8gQXBwbHkgTWlkZGxld2FyZVxuICAgICAgbGV0IGZpbmFsU3FsID0gdGhpcy5hcHBseU1pZGRsZXdhcmVPbkJlZm9yZVF1ZXJ5KG9yaWdpbmFsU3FsLCB2YWx1ZXMpXG5cbiAgICAgIC8vIEJpbmQgZHluYW1pYyB2YWx1ZXMgdG8gU1FMXG4gICAgICBmaW5hbFNxbCA9IHRoaXMucXVlcnlCaW5kVmFsdWVzKGZpbmFsU3FsLCB2YWx1ZXMpLnRyaW0oKVxuXG4gICAgICB0aGlzLmNvbm5lY3Rpb24ucXVlcnkoZmluYWxTcWwsIChlcnIsIHJlc3VsdHMsIGZpZWxkcykgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKHtlcnIsIHNxbDogZmluYWxTcWx9KVxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgLy8gV2hlbiBjYWxsaW5nIGBjb25uZWN0aW9uLnF1ZXJ5YCwgdGhlIHJlc3VsdHMgcmV0dXJuZWQgYXJlIGVpdGhlciBcInJvd3NcIlxuICAgICAgICAgIC8vIGluIHRoZSBjYXNlIG9mIGFuIFNRTCBzdGF0ZW1lbnQsIG9yIG1ldGEgcmVzdWx0cyBpbiB0aGUgY2FzZSBvZiBub24tU1FMXG5cbiAgICAgICAgICAvLyBBcHBseSBNaWRkbGV3YXJlXG4gICAgICAgICAgcmVzdWx0cyA9IHRoaXMuYXBwbHlNaWRkbGV3YXJlT25SZXN1bHRzKG9yaWdpbmFsU3FsLCByZXN1bHRzKVxuXG4gICAgICAgICAgLy8gSWYgc3FsIGlzIFNFTEVDVFxuICAgICAgICAgIGlmICh0aGlzLmlzU2VsZWN0KGZpbmFsU3FsKSkge1xuXG4gICAgICAgICAgICAvLyBSZXN1bHRzIGlzIHRoZSByb3dzXG4gICAgICAgICAgICByZXMoeyByb3dzOiByZXN1bHRzLCBmaWVsZHMsIHNxbDogZmluYWxTcWx9KVxuXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcyh7IC4uLnJlc3VsdHMsIHNxbDogZmluYWxTcWwgfSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgcXVlcnlGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuXG4gICAgLy8gR2V0IGZ1bGwgcGF0aFxuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguam9pbihcbiAgICAgIHRoaXMuc2V0dGluZ3Muc3FsUGF0aCxcbiAgICAgIGZpbGVuYW1lICsgKHBhdGguZXh0bmFtZShmaWxlbmFtZSkgPT09ICcuc3FsJyA/ICcnIDogJy5zcWwnKVxuICAgICkpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAvLyBSZWFkIGZpbGUgYW5kIGV4ZWN1dGUgYXMgU1FMIHN0YXRlbWVudFxuICAgICAgZnMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGY4JywgKGVyciwgc3FsKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooJ0Nhbm5vdCBmaW5kOiAnICsgZXJyLnBhdGgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3FsID0gc3FsLnRyaW0oKVxuICAgICAgICAgIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzKS5jYXRjaChyZWopXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgSGVscGVyIEZ1bmN0aW9uc1xuICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogVHVybnMgYFNFTEVDVCAqIEZST00gdXNlciBXSEVSRSB1c2VyX2lkID0gOnVzZXJfaWRgLCBpbnRvXG4gICAqICAgICAgIGBTRUxFQ1QgKiBGUk9NIHVzZXIgV0hFUkUgdXNlcl9pZCA9IDFgXG4gICAqL1xuICBxdWVyeUJpbmRWYWx1ZXMocXVlcnksIHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSByZXR1cm4gcXVlcnlcblxuICAgIHJldHVybiBxdWVyeS5yZXBsYWNlKC9cXDooXFx3KykvZ20sICh0eHQsIGtleSkgPT5cbiAgICAgIHZhbHVlcy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSA6IHR4dFxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJucyB7dXNlcl9pZDogMSwgYWdlOiAzMH0sIGludG9cbiAgICogICAgICAgXCJXSEVSRSB1c2VyX2lkID0gMSBBTkQgYWdlID0gMzBcIlxuICAgKi9cbiAgc3FsV2hlcmUod2hlcmUpIHtcbiAgICBpZiAoIXdoZXJlKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHdoZXJlID09PSAnc3RyaW5nJykgcmV0dXJuIHdoZXJlXG5cbiAgICBjb25zdCB3aGVyZUFycmF5ID0gW11cblxuICAgIGZvciAobGV0IGtleSBpbiB3aGVyZSkge1xuICAgICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh3aGVyZVtrZXldKSlcbiAgICB9XG5cbiAgICByZXR1cm4gJ1dIRVJFICcgKyB3aGVyZUFycmF5LmpvaW4oJyBBTkQgJylcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJucyB7Zmlyc3RfbmFtZTogJ0JyYWQnLCBsYXN0X25hbWU6ICdXZXN0ZmFsbCd9LCBpbnRvXG4gICAqICAgICAgIGBmaXJzdF9uYW1lYCA9ICdCcmFkJywgYGxhc3RfbmFtZWAgPSAnV2VzdGZhbGwnXG4gICAqL1xuICBjcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKSB7XG4gICAgY29uc3QgdmFsdWVzQXJyYXkgPSBbXVxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWVzID0gdGhpcy50cmFuc2Zvcm1WYWx1ZXModmFsdWVzKVxuXG4gICAgZm9yIChsZXQga2V5IGluIHRyYW5zZm9ybWVkVmFsdWVzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRyYW5zZm9ybWVkVmFsdWVzW2tleV1cbiAgICAgIHZhbHVlc0FycmF5LnB1c2goYFxcYCR7a2V5fVxcYCA9ICR7dmFsdWV9YClcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVzQXJyYXkuam9pbigpXG4gIH1cblxuICAvKipcbiAgICogSWYgdGhlIGFyZ3VtZW50IHZhbHVlcyBtYXRjaCB0aGUga2V5cyBvZiB0aGUgdGhpcy50cmFuc2Zvcm1zXG4gICAqIG9iamVjdCwgdGhlbiB1c2UgdGhlIHRyYW5zZm9ybXMgdmFsdWUgaW5zdGVhZCBvZiB0aGUgc3VwcGxpZWQgdmFsdWVcbiAgICovXG4gIHRyYW5zZm9ybVZhbHVlcyh2YWx1ZXMpIHtcbiAgICBjb25zdCBuZXdPYmogPSB7fVxuXG4gICAgZm9yIChsZXQga2V5IGluIHZhbHVlcykge1xuICAgICAgY29uc3QgcmF3VmFsdWUgPSB2YWx1ZXNba2V5XVxuICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5zZXR0aW5ncy50cmFuc2Zvcm1zW3Jhd1ZhbHVlXVxuICAgICAgbGV0IHZhbHVlXG5cbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRyYW5zZm9ybXMuaGFzT3duUHJvcGVydHkocmF3VmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gdHlwZW9mIHRyYW5zZm9ybSA9PT0gJ2Z1bmN0aW9uJyA/IHRyYW5zZm9ybShyYXdWYWx1ZSwgdmFsdWVzKSA6IHRyYW5zZm9ybVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBteXNxbC5lc2NhcGUocmF3VmFsdWUpXG4gICAgICB9XG5cbiAgICAgIG5ld09ialtrZXldID0gdmFsdWVcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3T2JqXG4gIH1cblxuICBpc1NlbGVjdChzcWwpIHtcbiAgICByZXR1cm4gc3FsLnRyaW0oKS50b1VwcGVyQ2FzZSgpLm1hdGNoKC9eU0VMRUNULylcbiAgfVxuXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICBNaWRkbGV3YXJlXG4gICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIG9uUmVzdWx0cyhtaWRkbGV3YXJlKSB7XG4gICAgaWYgKHR5cGVvZiBtaWRkbGV3YXJlICE9PSAnZnVuY3Rpb24nKSByZXR1cm5cbiAgICB0aGlzLm1pZGRsZXdhcmUub25SZXN1bHRzLnB1c2gobWlkZGxld2FyZSlcbiAgfVxuXG4gIG9uQmVmb3JlUXVlcnkobWlkZGxld2FyZSkge1xuICAgIGlmICh0eXBlb2YgbWlkZGxld2FyZSAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuXG4gICAgdGhpcy5taWRkbGV3YXJlLm9uQmVmb3JlUXVlcnkucHVzaChtaWRkbGV3YXJlKVxuICB9XG5cbiAgYXBwbHlNaWRkbGV3YXJlT25SZXN1bHRzKHNxbCwgcmVzdWx0cykge1xuICAgIHRoaXMubWlkZGxld2FyZS5vblJlc3VsdHMubWFwKG1pZGRsZXdhcmUgPT4ge1xuICAgICAgcmVzdWx0cyA9IG1pZGRsZXdhcmUoc3FsLCByZXN1bHRzKVxuICAgIH0pXG4gICAgcmV0dXJuIHJlc3VsdHNcbiAgfVxuXG4gIGFwcGx5TWlkZGxld2FyZU9uQmVmb3JlUXVlcnkoc3FsLCB2YWx1ZXMpIHtcbiAgICB0aGlzLm1pZGRsZXdhcmUub25CZWZvcmVRdWVyeS5tYXAobWlkZGxld2FyZSA9PiB7XG4gICAgICBzcWwgPSBtaWRkbGV3YXJlKHNxbCwgdmFsdWVzKVxuICAgIH0pXG4gICAgcmV0dXJuIHNxbFxuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlTcWxcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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