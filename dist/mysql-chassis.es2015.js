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
  host: 'localhost',
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
  function MySql(options) {
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
        sql = middleware(values, sql);
      });
      return sql;
    }
  }]);
  return MySql;
}();

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IGRlZmF1bHRDb25uZWN0aW9uT3B0aW9ucyA9IHtcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBwYXNzd29yZDogJycsXG4gICAgc3FsUGF0aDogJy4vc3FsJyxcbiAgICB0cmFuc2Zvcm1zOiB7XG4gICAgICB1bmRlZmluZWQ6ICdOVUxMJyxcbiAgICAgICcnOiAnTlVMTCcsXG4gICAgICAnTk9XKCknOiAnTk9XKCknLFxuICAgICAgJ0NVUlRJTUUoKSc6ICdDVVJUSU1FKCknXG4gICAgfVxufVxuXG5jbGFzcyBNeVNxbCB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHsuLi5kZWZhdWx0Q29ubmVjdGlvbk9wdGlvbnMsIC4uLm9wdGlvbnN9XG4gICAgY29uc3Qge3NxbFBhdGgsIHRyYW5zZm9ybXMsIC4uLmNvbm5lY3Rpb25PcHRpb25zfSA9IG9wdGlvbnNcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBteXNxbC5jcmVhdGVDb25uZWN0aW9uKGNvbm5lY3Rpb25PcHRpb25zKVxuICAgIHRoaXMuc2V0dGluZ3MgPSB7c3FsUGF0aCwgdHJhbnNmb3Jtc31cbiAgICB0aGlzLm1pZGRsZXdhcmUgPSB7XG4gICAgICAgIG9uQmVmb3JlUXVlcnk6IFtdLFxuICAgICAgICBvblJlc3VsdHM6IFtdXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnRcbiAgICovXG4gIHNlbGVjdChzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzdWx0cyA9PiByZXN1bHRzLnJvd3MpXG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudCBmcm9tIGEgZmlsZVxuICAgKi9cbiAgc2VsZWN0RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcykudGhlbihyZXN1bHRzID0+IHJlc3VsdHMucm93cylcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIElOU0VSVCBzdGF0ZW1lbnRcbiAgICovXG4gIGluc2VydCh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYW4gVVBEQVRFIHN0YXRlbWVudFxuICAgKi9cbiAgdXBkYXRlKHRhYmxlLCB2YWx1ZXMsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYFVQREFURSBcXGAke3RhYmxlfVxcYCBTRVQgJHt0aGlzLmNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpfSAke3RoaXMuc3FsV2hlcmUod2hlcmUpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhIERFTEVURSBzdGF0ZW1lbnRcbiAgICovXG4gIGRlbGV0ZSh0YWJsZSwgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgREVMRVRFIEZST00gXFxgJHt0YWJsZX1cXGAgJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIFByZXBhcmUgYW5kIHJ1biBhIHF1ZXJ5IHdpdGggYm91bmQgdmFsdWVzLiBSZXR1cm4gYSBwcm9taXNlXG4gICAqL1xuICBxdWVyeShvcmlnaW5hbFNxbCwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG5cbiAgICAgIC8vIEFwcGx5IE1pZGRsZXdhcmVcbiAgICAgIGxldCBmaW5hbFNxbCA9IHRoaXMuYXBwbHlNaWRkbGV3YXJlT25CZWZvcmVRdWVyeShvcmlnaW5hbFNxbCwgdmFsdWVzKVxuXG4gICAgICAvLyBCaW5kIGR5bmFtaWMgdmFsdWVzIHRvIFNRTFxuICAgICAgZmluYWxTcWwgPSB0aGlzLnF1ZXJ5QmluZFZhbHVlcyhmaW5hbFNxbCwgdmFsdWVzKS50cmltKClcblxuICAgICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KGZpbmFsU3FsLCAoZXJyLCByZXN1bHRzLCBmaWVsZHMpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaih7ZXJyLCBzcWw6IGZpbmFsU3FsfSlcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vIEFwcGx5IE1pZGRsZXdhcmVcbiAgICAgICAgICByZXN1bHRzID0gdGhpcy5hcHBseU1pZGRsZXdhcmVPblJlc3VsdHMob3JpZ2luYWxTcWwsIHJlc3VsdHMpXG5cbiAgICAgICAgICAvLyBJZiBzcWwgaXMgU0VMRUNUXG4gICAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3QoZmluYWxTcWwpKSB7XG5cbiAgICAgICAgICAgIC8vIFJlc3VsdHMgaXMgdGhlIHJvd3NcbiAgICAgICAgICAgIHJlcyh7IHJvd3M6IHJlc3VsdHMsIGZpZWxkcywgc3FsOiBmaW5hbFNxbH0pXG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzKHsgLi4ucmVzdWx0cywgc3FsOiBmaW5hbFNxbCB9KVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBxdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcyA9IHt9KSB7XG5cbiAgICAvLyBHZXQgZnVsbCBwYXRoXG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5qb2luKFxuICAgICAgdGhpcy5zZXR0aW5ncy5zcWxQYXRoLFxuICAgICAgZmlsZW5hbWUgKyAocGF0aC5leHRuYW1lKGZpbGVuYW1lKSA9PT0gJy5zcWwnID8gJycgOiAnLnNxbCcpXG4gICAgKSlcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIC8vIFJlYWQgZmlsZSBhbmQgZXhlY3V0ZSBhcyBTUUwgc3RhdGVtZW50XG4gICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnLCAoZXJyLCBzcWwpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaignQ2Fubm90IGZpbmQ6ICcgKyBlcnIucGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzcWwgPSBzcWwudHJpbSgpXG4gICAgICAgICAgdGhpcy5xdWVyeShzcWwsIHZhbHVlcykudGhlbihyZXMpLmNhdGNoKHJlailcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICBIZWxwZXIgRnVuY3Rpb25zXG4gICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBUdXJucyBgU0VMRUNUICogRlJPTSB1c2VyIFdIRVJFIHVzZXJfaWQgPSA6dXNlcl9pZGAsIGludG9cbiAgICogICAgICAgYFNFTEVDVCAqIEZST00gdXNlciBXSEVSRSB1c2VyX2lkID0gMWBcbiAgICovXG4gIHF1ZXJ5QmluZFZhbHVlcyhxdWVyeSwgdmFsdWVzKSB7XG4gICAgaWYgKCF2YWx1ZXMpIHJldHVybiBxdWVyeVxuXG4gICAgcmV0dXJuIHF1ZXJ5LnJlcGxhY2UoL1xcOihcXHcrKS9nbSwgKHR4dCwga2V5KSA9PlxuICAgICAgdmFsdWVzLmhhc093blByb3BlcnR5KGtleSkgPyBteXNxbC5lc2NhcGUodmFsdWVzW2tleV0pIDogdHh0XG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIHt1c2VyX2lkOiAxLCBhZ2U6IDMwfSwgaW50b1xuICAgKiAgICAgICBcIldIRVJFIHVzZXJfaWQgPSAxIEFORCBhZ2UgPSAzMFwiXG4gICAqL1xuICBzcWxXaGVyZSh3aGVyZSkge1xuICAgIGlmICghd2hlcmUpIHJldHVyblxuICAgIGlmICh0eXBlb2Ygd2hlcmUgPT09ICdzdHJpbmcnKSByZXR1cm4gd2hlcmVcblxuICAgIGNvbnN0IHdoZXJlQXJyYXkgPSBbXVxuXG4gICAgZm9yIChsZXQga2V5IGluIHdoZXJlKSB7XG4gICAgICB3aGVyZUFycmF5LnB1c2goJ2AnICsga2V5ICsgJ2AgPSAnICsgbXlzcWwuZXNjYXBlKHdoZXJlW2tleV0pKVxuICAgIH1cblxuICAgIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIHtmaXJzdF9uYW1lOiAnQnJhZCcsIGxhc3RfbmFtZTogJ1dlc3RmYWxsJ30sIGludG9cbiAgICogICAgICAgYGZpcnN0X25hbWVgID0gJ0JyYWQnLCBgbGFzdF9uYW1lYCA9ICdXZXN0ZmFsbCdcbiAgICovXG4gIGNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpIHtcbiAgICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZXMgPSB0aGlzLnRyYW5zZm9ybVZhbHVlcyh2YWx1ZXMpXG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdHJhbnNmb3JtZWRWYWx1ZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdHJhbnNmb3JtZWRWYWx1ZXNba2V5XVxuICAgICAgdmFsdWVzQXJyYXkucHVzaChgXFxgJHtrZXl9XFxgID0gJHt2YWx1ZX1gKVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgYXJndW1lbnQgdmFsdWVzIG1hdGNoIHRoZSBrZXlzIG9mIHRoZSB0aGlzLnRyYW5zZm9ybXNcbiAgICogb2JqZWN0LCB0aGVuIHVzZSB0aGUgdHJhbnNmb3JtcyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBzdXBwbGllZCB2YWx1ZVxuICAgKi9cbiAgdHJhbnNmb3JtVmFsdWVzKHZhbHVlcykge1xuICAgIGNvbnN0IG5ld09iaiA9IHt9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICBjb25zdCByYXdWYWx1ZSA9IHZhbHVlc1trZXldXG4gICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLnNldHRpbmdzLnRyYW5zZm9ybXNbcmF3VmFsdWVdXG4gICAgICBsZXQgdmFsdWVcblxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudHJhbnNmb3Jtcy5oYXNPd25Qcm9wZXJ0eShyYXdWYWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSB0eXBlb2YgdHJhbnNmb3JtID09PSAnZnVuY3Rpb24nID8gdHJhbnNmb3JtKHJhd1ZhbHVlLCB2YWx1ZXMpIDogdHJhbnNmb3JtXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IG15c3FsLmVzY2FwZShyYXdWYWx1ZSlcbiAgICAgIH1cblxuICAgICAgbmV3T2JqW2tleV0gPSB2YWx1ZVxuICAgIH1cblxuICAgIHJldHVybiBuZXdPYmpcbiAgfVxuXG4gIGlzU2VsZWN0KHNxbCkge1xuICAgIHJldHVybiBzcWwudHJpbSgpLnRvVXBwZXJDYXNlKCkubWF0Y2goL15TRUxFQ1QvKVxuICB9XG5cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIE1pZGRsZXdhcmVcbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgb25SZXN1bHRzKG1pZGRsZXdhcmUpIHtcbiAgICBpZiAodHlwZW9mIG1pZGRsZXdhcmUgIT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIHRoaXMubWlkZGxld2FyZS5vblJlc3VsdHMucHVzaChtaWRkbGV3YXJlKVxuICB9XG5cbiAgb25CZWZvcmVRdWVyeShtaWRkbGV3YXJlKSB7XG4gICAgaWYgKHR5cGVvZiBtaWRkbGV3YXJlICE9PSAnZnVuY3Rpb24nKSByZXR1cm5cbiAgICB0aGlzLm1pZGRsZXdhcmUub25CZWZvcmVRdWVyeS5wdXNoKG1pZGRsZXdhcmUpXG4gIH1cblxuICBhcHBseU1pZGRsZXdhcmVPblJlc3VsdHMoc3FsLCByZXN1bHRzKSB7XG4gICAgdGhpcy5taWRkbGV3YXJlLm9uUmVzdWx0cy5tYXAobWlkZGxld2FyZSA9PiB7XG4gICAgICByZXN1bHRzID0gbWlkZGxld2FyZShzcWwsIHJlc3VsdHMpXG4gICAgfSlcbiAgICByZXR1cm4gcmVzdWx0c1xuICB9XG5cbiAgYXBwbHlNaWRkbGV3YXJlT25CZWZvcmVRdWVyeShzcWwsIHZhbHVlcykge1xuICAgIHRoaXMubWlkZGxld2FyZS5vbkJlZm9yZVF1ZXJ5Lm1hcChtaWRkbGV3YXJlID0+IHtcbiAgICAgIHNxbCA9IG1pZGRsZXdhcmUodmFsdWVzLCBzcWwpXG4gICAgfSlcbiAgICByZXR1cm4gc3FsXG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVNxbFxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxJQUFNLDJCQUEyQjtRQUN2QixXQUFOO1lBQ1UsRUFBVjtXQUNTLE9BQVQ7Y0FDWTtlQUNDLE1BQVg7UUFDSSxNQUFKO2FBQ1MsT0FBVDtpQkFDYSxXQUFiO0dBSkY7Q0FKRTs7SUFZQTtXQUFBLEtBQ0osQ0FBYSxPQUFiLEVBQXNCO3NDQURsQixPQUNrQjs7dUNBQ04sMEJBQTZCLFFBQTNDLENBRG9CO21CQUVnQyxRQUZoQztRQUViLDJCQUZhO1FBRUosaUNBRkk7UUFFVyw4RkFGWDs7U0FHZixVQUFMLEdBQWtCLE1BQU0sZ0JBQU4sQ0FBdUIsaUJBQXZCLENBQWxCLENBSG9CO1NBSWYsUUFBTCxHQUFnQixFQUFD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