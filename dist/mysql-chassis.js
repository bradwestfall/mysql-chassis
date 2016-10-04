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
          whereArray.push('`' + key + '` = ' + mysql.escape(value));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5qcyIsInNvdXJjZXMiOlsiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuY29uc3QgZGVmYXVsdENvbm5lY3Rpb25PcHRpb25zID0ge1xuICBwYXNzd29yZDogJycsXG4gIHNxbFBhdGg6ICcuL3NxbCcsXG4gIHRyYW5zZm9ybXM6IHtcbiAgICB1bmRlZmluZWQ6ICdOVUxMJyxcbiAgICAnJzogJ05VTEwnLFxuICAgICdOT1coKSc6ICdOT1coKScsXG4gICAgJ0NVUlRJTUUoKSc6ICdDVVJUSU1FKCknXG4gIH1cbn1cblxuY2xhc3MgTXlTcWwge1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciAocnVucyBjb25uZWN0aW9uKVxuICAgKi9cbiAgY29uc3RydWN0b3IgKG9wdGlvbnMsIGVyckNhbGxiYWNrKSB7XG4gICAgb3B0aW9ucyA9IHsuLi5kZWZhdWx0Q29ubmVjdGlvbk9wdGlvbnMsIC4uLm9wdGlvbnN9XG4gICAgY29uc3Qge3NxbFBhdGgsIHRyYW5zZm9ybXMsIC4uLmNvbm5lY3Rpb25PcHRpb25zfSA9IG9wdGlvbnNcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBteXNxbC5jcmVhdGVDb25uZWN0aW9uKGNvbm5lY3Rpb25PcHRpb25zKVxuICAgIHRoaXMuc2V0dGluZ3MgPSB7c3FsUGF0aCwgdHJhbnNmb3Jtc31cbiAgICB0aGlzLm1pZGRsZXdhcmUgPSB7XG4gICAgICAgIG9uQmVmb3JlUXVlcnk6IFtdLFxuICAgICAgICBvblJlc3VsdHM6IFtdXG4gICAgfVxuICAgIHRoaXMuY29ubmVjdGlvbi5jb25uZWN0KGVyciA9PiB7XG4gICAgICBpZiAodHlwZW9mIGVyckNhbGxiYWNrID09PSAnZnVuY3Rpb24nICYmIGVycikgZXJyQ2FsbGJhY2soZXJyKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudFxuICAgKi9cbiAgc2VsZWN0KHNxbCwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwsIHZhbHVlcykudGhlbihyZXN1bHRzID0+IHJlc3VsdHMucm93cylcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBTRUxFQ1Qgc3RhdGVtZW50IGZyb20gYSBmaWxlXG4gICAqL1xuICBzZWxlY3RGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5RmlsZShmaWxlbmFtZSwgdmFsdWVzKS50aGVuKHJlc3VsdHMgPT4gcmVzdWx0cy5yb3dzKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYW4gSU5TRVJUIHN0YXRlbWVudFxuICAgKi9cbiAgaW5zZXJ0KHRhYmxlLCB2YWx1ZXMgPSB7fSkge1xuICAgIGNvbnN0IHNxbCA9IGBJTlNFUlQgSU5UTyBcXGAke3RhYmxlfVxcYCBTRVQgJHt0aGlzLmNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhbiBVUERBVEUgc3RhdGVtZW50XG4gICAqL1xuICB1cGRhdGUodGFibGUsIHZhbHVlcywgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgVVBEQVRFIFxcYCR7dGFibGV9XFxgIFNFVCAke3RoaXMuY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcyl9ICR7dGhpcy5zcWxXaGVyZSh3aGVyZSl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGEgREVMRVRFIHN0YXRlbWVudFxuICAgKi9cbiAgZGVsZXRlKHRhYmxlLCB3aGVyZSkge1xuICAgIGNvbnN0IHNxbCA9IGBERUxFVEUgRlJPTSBcXGAke3RhYmxlfVxcYCAke3RoaXMuc3FsV2hlcmUod2hlcmUpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogUHJlcGFyZSBhbmQgcnVuIGEgcXVlcnkgd2l0aCBib3VuZCB2YWx1ZXMuIFJldHVybiBhIHByb21pc2VcbiAgICovXG4gIHF1ZXJ5KG9yaWdpbmFsU3FsLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcblxuICAgICAgLy8gQXBwbHkgTWlkZGxld2FyZVxuICAgICAgbGV0IGZpbmFsU3FsID0gdGhpcy5hcHBseU1pZGRsZXdhcmVPbkJlZm9yZVF1ZXJ5KG9yaWdpbmFsU3FsLCB2YWx1ZXMpXG5cbiAgICAgIC8vIEJpbmQgZHluYW1pYyB2YWx1ZXMgdG8gU1FMXG4gICAgICBmaW5hbFNxbCA9IHRoaXMucXVlcnlCaW5kVmFsdWVzKGZpbmFsU3FsLCB2YWx1ZXMpLnRyaW0oKVxuXG4gICAgICB0aGlzLmNvbm5lY3Rpb24ucXVlcnkoZmluYWxTcWwsIChlcnIsIHJlc3VsdHMsIGZpZWxkcykgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKHtlcnIsIHNxbDogZmluYWxTcWx9KVxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgLy8gV2hlbiBjYWxsaW5nIGBjb25uZWN0aW9uLnF1ZXJ5YCwgdGhlIHJlc3VsdHMgcmV0dXJuZWQgYXJlIGVpdGhlciBcInJvd3NcIlxuICAgICAgICAgIC8vIGluIHRoZSBjYXNlIG9mIGFuIFNRTCBzdGF0ZW1lbnQsIG9yIG1ldGEgcmVzdWx0cyBpbiB0aGUgY2FzZSBvZiBub24tU1FMXG5cbiAgICAgICAgICAvLyBBcHBseSBNaWRkbGV3YXJlXG4gICAgICAgICAgcmVzdWx0cyA9IHRoaXMuYXBwbHlNaWRkbGV3YXJlT25SZXN1bHRzKG9yaWdpbmFsU3FsLCByZXN1bHRzKVxuXG4gICAgICAgICAgLy8gSWYgc3FsIGlzIFNFTEVDVFxuICAgICAgICAgIGlmICh0aGlzLmlzU2VsZWN0KGZpbmFsU3FsKSkge1xuXG4gICAgICAgICAgICAvLyBSZXN1bHRzIGlzIHRoZSByb3dzXG4gICAgICAgICAgICByZXMoeyByb3dzOiByZXN1bHRzLCBmaWVsZHMsIHNxbDogZmluYWxTcWx9KVxuXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcyh7IC4uLnJlc3VsdHMsIHNxbDogZmluYWxTcWwgfSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgcXVlcnlGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuXG4gICAgLy8gR2V0IGZ1bGwgcGF0aFxuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguam9pbihcbiAgICAgIHRoaXMuc2V0dGluZ3Muc3FsUGF0aCxcbiAgICAgIGZpbGVuYW1lICsgKHBhdGguZXh0bmFtZShmaWxlbmFtZSkgPT09ICcuc3FsJyA/ICcnIDogJy5zcWwnKVxuICAgICkpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAvLyBSZWFkIGZpbGUgYW5kIGV4ZWN1dGUgYXMgU1FMIHN0YXRlbWVudFxuICAgICAgZnMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGY4JywgKGVyciwgc3FsKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooJ0Nhbm5vdCBmaW5kOiAnICsgZXJyLnBhdGgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3FsID0gc3FsLnRyaW0oKVxuICAgICAgICAgIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzKS5jYXRjaChyZWopXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgSGVscGVyIEZ1bmN0aW9uc1xuICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogVHVybnMgYFNFTEVDVCAqIEZST00gdXNlciBXSEVSRSB1c2VyX2lkID0gOnVzZXJfaWRgLCBpbnRvXG4gICAqICAgICAgIGBTRUxFQ1QgKiBGUk9NIHVzZXIgV0hFUkUgdXNlcl9pZCA9IDFgXG4gICAqL1xuICBxdWVyeUJpbmRWYWx1ZXMocXVlcnksIHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSByZXR1cm4gcXVlcnlcblxuICAgIHJldHVybiBxdWVyeS5yZXBsYWNlKC9cXDooXFx3KykvZ20sICh0eHQsIGtleSkgPT5cbiAgICAgIHZhbHVlcy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSA6IHR4dFxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJucyB7dXNlcl9pZDogMSwgYWdlOiBudWxsfSwgaW50b1xuICAgKiAgICAgICBcIldIRVJFIHVzZXJfaWQgPSAxIEFORCBhZ2UgSVMgTlVMTFwiXG4gICAqL1xuICBzcWxXaGVyZSh3aGVyZSkge1xuICAgIGlmICghd2hlcmUpIHJldHVyblxuICAgIGlmICh0eXBlb2Ygd2hlcmUgPT09ICdzdHJpbmcnKSByZXR1cm4gd2hlcmVcblxuICAgIGNvbnN0IHdoZXJlQXJyYXkgPSBbXVxuXG4gICAgZm9yIChsZXQga2V5IGluIHdoZXJlKSB7XG4gICAgICBsZXQgdmFsdWUgPSB3aGVyZVtrZXldXG4gICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgIElTIE5VTEwnKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh2YWx1ZSkpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuICdXSEVSRSAnICsgd2hlcmVBcnJheS5qb2luKCcgQU5EICcpXG4gIH1cblxuICAvKipcbiAgICogVHVybnMge2ZpcnN0X25hbWU6ICdCcmFkJywgbGFzdF9uYW1lOiAnV2VzdGZhbGwnfSwgaW50b1xuICAgKiAgICAgICBgZmlyc3RfbmFtZWAgPSAnQnJhZCcsIGBsYXN0X25hbWVgID0gJ1dlc3RmYWxsJ1xuICAgKi9cbiAgY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcykge1xuICAgIGNvbnN0IHZhbHVlc0FycmF5ID0gW11cbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlcyA9IHRoaXMudHJhbnNmb3JtVmFsdWVzKHZhbHVlcylcblxuICAgIGZvciAobGV0IGtleSBpbiB0cmFuc2Zvcm1lZFZhbHVlcykge1xuICAgICAgY29uc3QgdmFsdWUgPSB0cmFuc2Zvcm1lZFZhbHVlc1trZXldXG4gICAgICB2YWx1ZXNBcnJheS5wdXNoKGBcXGAke2tleX1cXGAgPSAke3ZhbHVlfWApXG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlc0FycmF5LmpvaW4oKVxuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBhcmd1bWVudCB2YWx1ZXMgbWF0Y2ggdGhlIGtleXMgb2YgdGhlIHRoaXMudHJhbnNmb3Jtc1xuICAgKiBvYmplY3QsIHRoZW4gdXNlIHRoZSB0cmFuc2Zvcm1zIHZhbHVlIGluc3RlYWQgb2YgdGhlIHN1cHBsaWVkIHZhbHVlXG4gICAqL1xuICB0cmFuc2Zvcm1WYWx1ZXModmFsdWVzKSB7XG4gICAgY29uc3QgbmV3T2JqID0ge31cblxuICAgIGZvciAobGV0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gdmFsdWVzW2tleV1cbiAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuc2V0dGluZ3MudHJhbnNmb3Jtc1tyYXdWYWx1ZV1cbiAgICAgIGxldCB2YWx1ZVxuXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy50cmFuc2Zvcm1zLmhhc093blByb3BlcnR5KHJhd1ZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IHR5cGVvZiB0cmFuc2Zvcm0gPT09ICdmdW5jdGlvbicgPyB0cmFuc2Zvcm0ocmF3VmFsdWUsIHZhbHVlcykgOiB0cmFuc2Zvcm1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gbXlzcWwuZXNjYXBlKHJhd1ZhbHVlKVxuICAgICAgfVxuXG4gICAgICBuZXdPYmpba2V5XSA9IHZhbHVlXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld09ialxuICB9XG5cbiAgaXNTZWxlY3Qoc3FsKSB7XG4gICAgcmV0dXJuIHNxbC50cmltKCkudG9VcHBlckNhc2UoKS5tYXRjaCgvXlNFTEVDVC8pXG4gIH1cblxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgTWlkZGxld2FyZVxuICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICBvblJlc3VsdHMobWlkZGxld2FyZSkge1xuICAgIGlmICh0eXBlb2YgbWlkZGxld2FyZSAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuXG4gICAgdGhpcy5taWRkbGV3YXJlLm9uUmVzdWx0cy5wdXNoKG1pZGRsZXdhcmUpXG4gIH1cblxuICBvbkJlZm9yZVF1ZXJ5KG1pZGRsZXdhcmUpIHtcbiAgICBpZiAodHlwZW9mIG1pZGRsZXdhcmUgIT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIHRoaXMubWlkZGxld2FyZS5vbkJlZm9yZVF1ZXJ5LnB1c2gobWlkZGxld2FyZSlcbiAgfVxuXG4gIGFwcGx5TWlkZGxld2FyZU9uUmVzdWx0cyhzcWwsIHJlc3VsdHMpIHtcbiAgICB0aGlzLm1pZGRsZXdhcmUub25SZXN1bHRzLm1hcChtaWRkbGV3YXJlID0+IHtcbiAgICAgIHJlc3VsdHMgPSBtaWRkbGV3YXJlKHNxbCwgcmVzdWx0cylcbiAgICB9KVxuICAgIHJldHVybiByZXN1bHRzXG4gIH1cblxuICBhcHBseU1pZGRsZXdhcmVPbkJlZm9yZVF1ZXJ5KHNxbCwgdmFsdWVzKSB7XG4gICAgdGhpcy5taWRkbGV3YXJlLm9uQmVmb3JlUXVlcnkubWFwKG1pZGRsZXdhcmUgPT4ge1xuICAgICAgc3FsID0gbWlkZGxld2FyZShzcWwsIHZhbHVlcylcbiAgICB9KVxuICAgIHJldHVybiBzcWxcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IE15U3FsXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsSUFBTSwyQkFBMkI7WUFDckIsRUFBVjtXQUNTLE9BQVQ7Y0FDWTtlQUNDLE1BQVg7UUFDSSxNQUFKO2FBQ1MsT0FBVDtpQkFDYSxXQUFiO0dBSkY7Q0FISTs7SUFXQTs7Ozs7O1dBQUEsS0FLSixDQUFhLE9BQWIsRUFBc0IsV0FBdEIsRUFBbUM7c0NBTC9CLE9BSytCOzt1Q0FDbkIsMEJBQTZCLFFBQTNDLENBRGlDO21CQUVtQixRQUZuQjtRQUUxQiwyQkFGMEI7UUFFakIsaUNBRmlCO1FBRUYsOEZBRkU7O1NBRzVCLFVBQUwsR0FBa0IsTUFBTSxnQkFBTixDQUF1QixpQkFBdkIsQ0FBbEIsQ0FIaUM7U0FJNUIsUUFBTCxHQUFnQixFQUFDLGdCQUFELEVBQVUsc0JBQVYsRUFBaEIsQ0FKaUM7U0FLNUIsVUFBTCxHQUFrQjtxQkFDQyxFQUFmO2lCQUNXLEVBQVg7S0FGSixDQUxpQztTQVM1QixVQUFMLENBQWdCLE9BQWhCLENBQXdCLGVBQU87VUFDekIsT0FBTyxXQUFQLEtBQXVCLFVBQXZCLElBQXFDLEdBQXJDLEVBQTBDLFlBQVksR0FBWixFQUE5QztLQURzQixDQUF4QixDQVRpQztHQUFuQzs7Ozs7OzsyQkFMSTs7MkJBc0JHLEtBQWtCO1VBQWIsK0RBQVMsa0JBQUk7O2FBQ2hCLEtBQUssS0FBTCxDQUFXLEdBQVgsRUFBZ0IsTUFBaEIsRUFBd0IsSUFBeEIsQ0FBNkI7ZUFBVyxRQUFRLElBQVI7T0FBWCxDQUFwQyxDQUR1Qjs7Ozs7Ozs7OytCQU9kLFVBQXVCO1VBQWIsK0RBQVMsa0JBQUk7O2FBQ3pCLEtBQUssU0FBTCxDQUFlLFFBQWYsRUFBeUIsTUFBekIsRUFBaUMsSUFBakMsQ0FBc0M7ZUFBVyxRQUFR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