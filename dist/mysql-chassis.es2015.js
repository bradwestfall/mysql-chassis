import mysql from 'mysql';
import path from 'path';
import fs from 'fs';

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

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IGRlZmF1bHRDb25uZWN0aW9uT3B0aW9ucyA9IHtcbiAgcGFzc3dvcmQ6ICcnLFxuICBzcWxQYXRoOiAnLi9zcWwnLFxuICB0cmFuc2Zvcm1zOiB7XG4gICAgdW5kZWZpbmVkOiAnTlVMTCcsXG4gICAgJyc6ICdOVUxMJyxcbiAgICAnTk9XKCknOiAnTk9XKCknLFxuICAgICdDVVJUSU1FKCknOiAnQ1VSVElNRSgpJ1xuICB9XG59XG5cbmNsYXNzIE15U3FsIHtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3IgKHJ1bnMgY29ubmVjdGlvbilcbiAgICovXG4gIGNvbnN0cnVjdG9yIChvcHRpb25zLCBlcnJDYWxsYmFjaykge1xuICAgIG9wdGlvbnMgPSB7Li4uZGVmYXVsdENvbm5lY3Rpb25PcHRpb25zLCAuLi5vcHRpb25zfVxuICAgIGNvbnN0IHtzcWxQYXRoLCB0cmFuc2Zvcm1zLCAuLi5jb25uZWN0aW9uT3B0aW9uc30gPSBvcHRpb25zXG4gICAgdGhpcy5jb25uZWN0aW9uID0gbXlzcWwuY3JlYXRlQ29ubmVjdGlvbihjb25uZWN0aW9uT3B0aW9ucylcbiAgICB0aGlzLnNldHRpbmdzID0ge3NxbFBhdGgsIHRyYW5zZm9ybXN9XG4gICAgdGhpcy5taWRkbGV3YXJlID0ge1xuICAgICAgICBvbkJlZm9yZVF1ZXJ5OiBbXSxcbiAgICAgICAgb25SZXN1bHRzOiBbXVxuICAgIH1cbiAgICB0aGlzLmNvbm5lY3Rpb24uY29ubmVjdChlcnIgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBlcnJDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyAmJiBlcnIpIGVyckNhbGxiYWNrKGVycilcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnRcbiAgICovXG4gIHNlbGVjdChzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzdWx0cyA9PiByZXN1bHRzLnJvd3MpXG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudCBmcm9tIGEgZmlsZVxuICAgKi9cbiAgc2VsZWN0RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcykudGhlbihyZXN1bHRzID0+IHJlc3VsdHMucm93cylcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIElOU0VSVCBzdGF0ZW1lbnRcbiAgICovXG4gIGluc2VydCh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYW4gVVBEQVRFIHN0YXRlbWVudFxuICAgKi9cbiAgdXBkYXRlKHRhYmxlLCB2YWx1ZXMsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYFVQREFURSBcXGAke3RhYmxlfVxcYCBTRVQgJHt0aGlzLmNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpfSAke3RoaXMuc3FsV2hlcmUod2hlcmUpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhIERFTEVURSBzdGF0ZW1lbnRcbiAgICovXG4gIGRlbGV0ZSh0YWJsZSwgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgREVMRVRFIEZST00gXFxgJHt0YWJsZX1cXGAgJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIFByZXBhcmUgYW5kIHJ1biBhIHF1ZXJ5IHdpdGggYm91bmQgdmFsdWVzLiBSZXR1cm4gYSBwcm9taXNlXG4gICAqL1xuICBxdWVyeShvcmlnaW5hbFNxbCwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG5cbiAgICAgIC8vIEFwcGx5IE1pZGRsZXdhcmVcbiAgICAgIGxldCBmaW5hbFNxbCA9IHRoaXMuYXBwbHlNaWRkbGV3YXJlT25CZWZvcmVRdWVyeShvcmlnaW5hbFNxbCwgdmFsdWVzKVxuXG4gICAgICAvLyBCaW5kIGR5bmFtaWMgdmFsdWVzIHRvIFNRTFxuICAgICAgZmluYWxTcWwgPSB0aGlzLnF1ZXJ5QmluZFZhbHVlcyhmaW5hbFNxbCwgdmFsdWVzKS50cmltKClcblxuICAgICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KGZpbmFsU3FsLCAoZXJyLCByZXN1bHRzLCBmaWVsZHMpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaih7ZXJyLCBzcWw6IGZpbmFsU3FsfSlcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vIFdoZW4gY2FsbGluZyBgY29ubmVjdGlvbi5xdWVyeWAsIHRoZSByZXN1bHRzIHJldHVybmVkIGFyZSBlaXRoZXIgXCJyb3dzXCJcbiAgICAgICAgICAvLyBpbiB0aGUgY2FzZSBvZiBhbiBTUUwgc3RhdGVtZW50LCBvciBtZXRhIHJlc3VsdHMgaW4gdGhlIGNhc2Ugb2Ygbm9uLVNRTFxuXG4gICAgICAgICAgLy8gQXBwbHkgTWlkZGxld2FyZVxuICAgICAgICAgIHJlc3VsdHMgPSB0aGlzLmFwcGx5TWlkZGxld2FyZU9uUmVzdWx0cyhvcmlnaW5hbFNxbCwgcmVzdWx0cylcblxuICAgICAgICAgIC8vIElmIHNxbCBpcyBTRUxFQ1RcbiAgICAgICAgICBpZiAodGhpcy5pc1NlbGVjdChmaW5hbFNxbCkpIHtcblxuICAgICAgICAgICAgLy8gUmVzdWx0cyBpcyB0aGUgcm93c1xuICAgICAgICAgICAgcmVzKHsgcm93czogcmVzdWx0cywgZmllbGRzLCBzcWw6IGZpbmFsU3FsfSlcblxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMoeyAuLi5yZXN1bHRzLCBzcWw6IGZpbmFsU3FsIH0pXG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHF1ZXJ5RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcblxuICAgIC8vIEdldCBmdWxsIHBhdGhcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmpvaW4oXG4gICAgICB0aGlzLnNldHRpbmdzLnNxbFBhdGgsXG4gICAgICBmaWxlbmFtZSArIChwYXRoLmV4dG5hbWUoZmlsZW5hbWUpID09PSAnLnNxbCcgPyAnJyA6ICcuc3FsJylcbiAgICApKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgLy8gUmVhZCBmaWxlIGFuZCBleGVjdXRlIGFzIFNRTCBzdGF0ZW1lbnRcbiAgICAgIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmOCcsIChlcnIsIHNxbCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKCdDYW5ub3QgZmluZDogJyArIGVyci5wYXRoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNxbCA9IHNxbC50cmltKClcbiAgICAgICAgICB0aGlzLnF1ZXJ5KHNxbCwgdmFsdWVzKS50aGVuKHJlcykuY2F0Y2gocmVqKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIEhlbHBlciBGdW5jdGlvbnNcbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIFR1cm5zIGBTRUxFQ1QgKiBGUk9NIHVzZXIgV0hFUkUgdXNlcl9pZCA9IDp1c2VyX2lkYCwgaW50b1xuICAgKiAgICAgICBgU0VMRUNUICogRlJPTSB1c2VyIFdIRVJFIHVzZXJfaWQgPSAxYFxuICAgKi9cbiAgcXVlcnlCaW5kVmFsdWVzKHF1ZXJ5LCB2YWx1ZXMpIHtcbiAgICBpZiAoIXZhbHVlcykgcmV0dXJuIHF1ZXJ5XG5cbiAgICByZXR1cm4gcXVlcnkucmVwbGFjZSgvXFw6KFxcdyspL2dtLCAodHh0LCBrZXkpID0+XG4gICAgICB2YWx1ZXMuaGFzT3duUHJvcGVydHkoa2V5KSA/IG15c3FsLmVzY2FwZSh2YWx1ZXNba2V5XSkgOiB0eHRcbiAgICApXG4gIH1cblxuICAvKipcbiAgICogVHVybnMge3VzZXJfaWQ6IDEsIGFnZTogbnVsbH0sIGludG9cbiAgICogICAgICAgXCJXSEVSRSB1c2VyX2lkID0gMSBBTkQgYWdlIElTIE5VTExcIlxuICAgKi9cbiAgc3FsV2hlcmUod2hlcmUpIHtcbiAgICBpZiAoIXdoZXJlKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHdoZXJlID09PSAnc3RyaW5nJykgcmV0dXJuIHdoZXJlXG5cbiAgICBjb25zdCB3aGVyZUFycmF5ID0gW11cblxuICAgIGZvciAobGV0IGtleSBpbiB3aGVyZSkge1xuICAgICAgbGV0IHZhbHVlID0gd2hlcmVba2V5XVxuICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCBJUyBOVUxMJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCA9ICcgKyBteXNxbC5lc2NhcGUodmFsdWUpKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIHtmaXJzdF9uYW1lOiAnQnJhZCcsIGxhc3RfbmFtZTogJ1dlc3RmYWxsJ30sIGludG9cbiAgICogICAgICAgYGZpcnN0X25hbWVgID0gJ0JyYWQnLCBgbGFzdF9uYW1lYCA9ICdXZXN0ZmFsbCdcbiAgICovXG4gIGNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpIHtcbiAgICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZXMgPSB0aGlzLnRyYW5zZm9ybVZhbHVlcyh2YWx1ZXMpXG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdHJhbnNmb3JtZWRWYWx1ZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdHJhbnNmb3JtZWRWYWx1ZXNba2V5XVxuICAgICAgdmFsdWVzQXJyYXkucHVzaChgXFxgJHtrZXl9XFxgID0gJHt2YWx1ZX1gKVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgYXJndW1lbnQgdmFsdWVzIG1hdGNoIHRoZSBrZXlzIG9mIHRoZSB0aGlzLnRyYW5zZm9ybXNcbiAgICogb2JqZWN0LCB0aGVuIHVzZSB0aGUgdHJhbnNmb3JtcyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBzdXBwbGllZCB2YWx1ZVxuICAgKi9cbiAgdHJhbnNmb3JtVmFsdWVzKHZhbHVlcykge1xuICAgIGNvbnN0IG5ld09iaiA9IHt9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICBjb25zdCByYXdWYWx1ZSA9IHZhbHVlc1trZXldXG4gICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLnNldHRpbmdzLnRyYW5zZm9ybXNbcmF3VmFsdWVdXG4gICAgICBsZXQgdmFsdWVcblxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudHJhbnNmb3Jtcy5oYXNPd25Qcm9wZXJ0eShyYXdWYWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSB0eXBlb2YgdHJhbnNmb3JtID09PSAnZnVuY3Rpb24nID8gdHJhbnNmb3JtKHJhd1ZhbHVlLCB2YWx1ZXMpIDogdHJhbnNmb3JtXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IG15c3FsLmVzY2FwZShyYXdWYWx1ZSlcbiAgICAgIH1cblxuICAgICAgbmV3T2JqW2tleV0gPSB2YWx1ZVxuICAgIH1cblxuICAgIHJldHVybiBuZXdPYmpcbiAgfVxuXG4gIGlzU2VsZWN0KHNxbCkge1xuICAgIHJldHVybiBzcWwudHJpbSgpLnRvVXBwZXJDYXNlKCkubWF0Y2goL15TRUxFQ1QvKVxuICB9XG5cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIE1pZGRsZXdhcmVcbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgb25SZXN1bHRzKG1pZGRsZXdhcmUpIHtcbiAgICBpZiAodHlwZW9mIG1pZGRsZXdhcmUgIT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIHRoaXMubWlkZGxld2FyZS5vblJlc3VsdHMucHVzaChtaWRkbGV3YXJlKVxuICB9XG5cbiAgb25CZWZvcmVRdWVyeShtaWRkbGV3YXJlKSB7XG4gICAgaWYgKHR5cGVvZiBtaWRkbGV3YXJlICE9PSAnZnVuY3Rpb24nKSByZXR1cm5cbiAgICB0aGlzLm1pZGRsZXdhcmUub25CZWZvcmVRdWVyeS5wdXNoKG1pZGRsZXdhcmUpXG4gIH1cblxuICBhcHBseU1pZGRsZXdhcmVPblJlc3VsdHMoc3FsLCByZXN1bHRzKSB7XG4gICAgdGhpcy5taWRkbGV3YXJlLm9uUmVzdWx0cy5tYXAobWlkZGxld2FyZSA9PiB7XG4gICAgICByZXN1bHRzID0gbWlkZGxld2FyZShzcWwsIHJlc3VsdHMpXG4gICAgfSlcbiAgICByZXR1cm4gcmVzdWx0c1xuICB9XG5cbiAgYXBwbHlNaWRkbGV3YXJlT25CZWZvcmVRdWVyeShzcWwsIHZhbHVlcykge1xuICAgIHRoaXMubWlkZGxld2FyZS5vbkJlZm9yZVF1ZXJ5Lm1hcChtaWRkbGV3YXJlID0+IHtcbiAgICAgIHNxbCA9IG1pZGRsZXdhcmUoc3FsLCB2YWx1ZXMpXG4gICAgfSlcbiAgICByZXR1cm4gc3FsXG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVNxbFxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxJQUFNLDJCQUEyQjtZQUNyQixFQUFWO1dBQ1MsT0FBVDtjQUNZO2VBQ0MsTUFBWDtRQUNJLE1BQUo7YUFDUyxPQUFUO2lCQUNhLFdBQWI7R0FKRjtDQUhJOztJQVdBOzs7Ozs7V0FBQSxLQUtKLENBQWEsT0FBYixFQUFzQixXQUF0QixFQUFtQztzQ0FML0IsT0FLK0I7O3VDQUNuQiwwQkFBNkIsUUFBM0MsQ0FEaUM7bUJBRW1CLFFBRm5CO1FBRTFCLDJCQUYwQjtRQUVqQixpQ0FGaUI7UUFFRiw4RkFGRTs7U0FHNUIsVUFBTCxHQUFrQixNQUFNLGdCQUFOLENBQXVCLGlCQUF2QixDQUFsQixDQUhpQztTQUk1QixRQUFMLEdBQWdCLEVBQUMsZ0JBQUQsRUFBVSxzQkFBVixFQUFoQixDQUppQztTQUs1QixVQUFMLEdBQWtCO3FCQUNDLEVBQWY7aUJBQ1csRUFBWDtLQUZKLENBTGlDO1NBUzVCLFVBQUwsQ0FBZ0IsT0FBaEIsQ0FBd0IsZUFBTztVQUN6QixPQUFPLFdBQVAsS0FBdUIsVUFBdkIsSUFBcUMsR0FBckMsRUFBMEMsWUFBWSxHQUFaLEVBQTlDO0tBRHNCLENBQXhCLENBVGlDO0dBQW5DOzs7Ozs7OzJCQUxJOzsyQkFzQkcsS0FBa0I7VUFBYiwrREFBUyxrQkFBSTs7YUFDaEIsS0FBSyxLQUFMLENBQVcsR0FBWCxFQUFnQixNQUFoQixFQUF3QixJQUF4QixDQUE2QjtlQUFXLFFBQVEsSUFBUjtPQUFYLENBQXBDLENBRHVCOzs7Ozs7Ozs7K0JBT2QsVUFBdUI7VUFBYiwrREFBUyxrQkFBSTs7YUFDekIsS0FBSyxTQUFMLENBQWUsUUFBZixFQUF5QixNQUF6QixFQUFpQyxJQUFqQyxDQUFzQztlQUFXLFFB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