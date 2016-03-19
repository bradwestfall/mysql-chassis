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

babelHelpers.slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

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
      'ON_BEFORE_QUERY': [],
      'ON_RESULTS': []
    };
  }

  /**
   * Run a SELECT statement
   * @param {string} sql
   * @param {object} values - binding values
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
     * @param {string} filename
     * @param {object} values - binding values
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
     * @param {string} sql
     * @param {object} values - binding values
     */

  }, {
    key: 'query',
    value: function query(sql) {
      var _this = this;

      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return new Promise(function (res, rej) {
        var _applyMiddleware = _this.applyMiddleware('ON_BEFORE_QUERY', sql, values);

        // Apply Middleware


        var _applyMiddleware2 = babelHelpers.slicedToArray(_applyMiddleware, 2);

        sql = _applyMiddleware2[0];
        values = _applyMiddleware2[1];


        var finalSql = _this.queryFormat(sql, values).trim();

        _this.connection.query(finalSql, function (err, results, fields) {
          if (err) {
            rej({ err: err, sql: finalSql });
          } else {

            // If sql is SELECT

            var _applyMiddleware3 = _this.applyMiddleware('ON_RESULTS', sql, results);

            // Apply Middleware


            var _applyMiddleware4 = babelHelpers.slicedToArray(_applyMiddleware3, 2);

            sql = _applyMiddleware4[0];
            results = _applyMiddleware4[1];
            if (_this.isSelect(finalSql)) {

              // Results is rows in the case of SELECT statements
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
    key: 'queryFormat',
    value: function queryFormat(query, values) {
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
     * If the values of the "values" argument match the keys of the this.transforms
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
      sql = sql.trim().toUpperCase();
      return sql.match(/^SELECT/);
    }

    /****************************************
      Middleware
    *****************************************/

  }, {
    key: 'use',
    value: function use(type, middleware) {
      if (typeof middleware !== 'function') return;
      var typeArray = this.middleware[type.toUpperCase()];
      if (!typeArray) return;
      typeArray.push(middleware);
    }
  }, {
    key: 'applyMiddleware',
    value: function applyMiddleware(type) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var typeArray = this.middleware[type.toUpperCase()];
      typeArray.forEach(function (middleware) {
        args = middleware(args);
      });
      return args;
    }
  }]);
  return MySql;
}();

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IGRlZmF1bHRDb25uZWN0aW9uT3B0aW9ucyA9IHtcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBwYXNzd29yZDogJycsXG4gICAgc3FsUGF0aDogJy4vc3FsJyxcbiAgICB0cmFuc2Zvcm1zOiB7XG4gICAgICB1bmRlZmluZWQ6ICdOVUxMJyxcbiAgICAgICcnOiAnTlVMTCcsXG4gICAgICAnTk9XKCknOiAnTk9XKCknLFxuICAgICAgJ0NVUlRJTUUoKSc6ICdDVVJUSU1FKCknXG4gICAgfVxufVxuXG5jbGFzcyBNeVNxbCB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHsuLi5kZWZhdWx0Q29ubmVjdGlvbk9wdGlvbnMsIC4uLm9wdGlvbnN9XG4gICAgY29uc3Qge3NxbFBhdGgsIHRyYW5zZm9ybXMsIC4uLmNvbm5lY3Rpb25PcHRpb25zfSA9IG9wdGlvbnNcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBteXNxbC5jcmVhdGVDb25uZWN0aW9uKGNvbm5lY3Rpb25PcHRpb25zKVxuICAgIHRoaXMuc2V0dGluZ3MgPSB7c3FsUGF0aCwgdHJhbnNmb3Jtc31cbiAgICB0aGlzLm1pZGRsZXdhcmUgPSB7XG4gICAgICAgICdPTl9CRUZPUkVfUVVFUlknOiBbXSxcbiAgICAgICAgJ09OX1JFU1VMVFMnOiBbXVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBTRUxFQ1Qgc3RhdGVtZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzcWxcbiAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlcyAtIGJpbmRpbmcgdmFsdWVzXG4gICAqL1xuICBzZWxlY3Qoc3FsLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbCwgdmFsdWVzKS50aGVuKHJlc3VsdHMgPT4gcmVzdWx0cy5yb3dzKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnQgZnJvbSBhIGZpbGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgc2VsZWN0RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcykudGhlbihyZXN1bHRzID0+IHJlc3VsdHMucm93cylcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIElOU0VSVCBzdGF0ZW1lbnRcbiAgICovXG4gIGluc2VydCh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYW4gVVBEQVRFIHN0YXRlbWVudFxuICAgKi9cbiAgdXBkYXRlKHRhYmxlLCB2YWx1ZXMsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYFVQREFURSBcXGAke3RhYmxlfVxcYCBTRVQgJHt0aGlzLmNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpfSAke3RoaXMuc3FsV2hlcmUod2hlcmUpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhIERFTEVURSBzdGF0ZW1lbnRcbiAgICovXG4gIGRlbGV0ZSh0YWJsZSwgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgREVMRVRFIEZST00gXFxgJHt0YWJsZX1cXGAgJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIFByZXBhcmUgYW5kIHJ1biBhIHF1ZXJ5IHdpdGggYm91bmQgdmFsdWVzLiBSZXR1cm4gYSBwcm9taXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzcWxcbiAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlcyAtIGJpbmRpbmcgdmFsdWVzXG4gICAqL1xuICBxdWVyeShzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuXG4gICAgICAvLyBBcHBseSBNaWRkbGV3YXJlXG4gICAgICBbc3FsLCB2YWx1ZXNdID0gdGhpcy5hcHBseU1pZGRsZXdhcmUoJ09OX0JFRk9SRV9RVUVSWScsIHNxbCwgdmFsdWVzKVxuXG4gICAgICBsZXQgZmluYWxTcWwgPSB0aGlzLnF1ZXJ5Rm9ybWF0KHNxbCwgdmFsdWVzKS50cmltKClcblxuICAgICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KGZpbmFsU3FsLCAoZXJyLCByZXN1bHRzLCBmaWVsZHMpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaih7ZXJyLCBzcWw6IGZpbmFsU3FsfSlcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vIEFwcGx5IE1pZGRsZXdhcmVcbiAgICAgICAgICBbc3FsLCByZXN1bHRzXSA9IHRoaXMuYXBwbHlNaWRkbGV3YXJlKCdPTl9SRVNVTFRTJywgc3FsLCByZXN1bHRzKVxuXG4gICAgICAgICAgLy8gSWYgc3FsIGlzIFNFTEVDVFxuICAgICAgICAgIGlmICh0aGlzLmlzU2VsZWN0KGZpbmFsU3FsKSkge1xuXG4gICAgICAgICAgICAvLyBSZXN1bHRzIGlzIHJvd3MgaW4gdGhlIGNhc2Ugb2YgU0VMRUNUIHN0YXRlbWVudHNcbiAgICAgICAgICAgIHJlcyh7IHJvd3M6IHJlc3VsdHMsIGZpZWxkcywgc3FsOiBmaW5hbFNxbH0pXG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzKHsgLi4ucmVzdWx0cywgc3FsOiBmaW5hbFNxbCB9KVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBxdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcyA9IHt9KSB7XG5cbiAgICAvLyBHZXQgZnVsbCBwYXRoXG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5qb2luKFxuICAgICAgdGhpcy5zZXR0aW5ncy5zcWxQYXRoLFxuICAgICAgZmlsZW5hbWUgKyAocGF0aC5leHRuYW1lKGZpbGVuYW1lKSA9PT0gJy5zcWwnID8gJycgOiAnLnNxbCcpXG4gICAgKSlcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIC8vIFJlYWQgZmlsZSBhbmQgZXhlY3V0ZSBhcyBTUUwgc3RhdGVtZW50XG4gICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnLCAoZXJyLCBzcWwpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaignQ2Fubm90IGZpbmQ6ICcgKyBlcnIucGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzcWwgPSBzcWwudHJpbSgpXG4gICAgICAgICAgdGhpcy5xdWVyeShzcWwsIHZhbHVlcykudGhlbihyZXMpLmNhdGNoKHJlailcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICBIZWxwZXIgRnVuY3Rpb25zXG4gICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBUdXJucyBgU0VMRUNUICogRlJPTSB1c2VyIFdIRVJFIHVzZXJfaWQgPSA6dXNlcl9pZGAsIGludG9cbiAgICogICAgICAgYFNFTEVDVCAqIEZST00gdXNlciBXSEVSRSB1c2VyX2lkID0gMWBcbiAgICovXG4gIHF1ZXJ5Rm9ybWF0KHF1ZXJ5LCB2YWx1ZXMpIHtcbiAgICBpZiAoIXZhbHVlcykgcmV0dXJuIHF1ZXJ5XG5cbiAgICByZXR1cm4gcXVlcnkucmVwbGFjZSgvXFw6KFxcdyspL2dtLCAodHh0LCBrZXkpID0+XG4gICAgICB2YWx1ZXMuaGFzT3duUHJvcGVydHkoa2V5KSA/IG15c3FsLmVzY2FwZSh2YWx1ZXNba2V5XSkgOiB0eHRcbiAgICApXG4gIH1cblxuICAvKipcbiAgICogVHVybnMge3VzZXJfaWQ6IDEsIGFnZTogMzB9LCBpbnRvXG4gICAqICAgICAgIFwiV0hFUkUgdXNlcl9pZCA9IDEgQU5EIGFnZSA9IDMwXCJcbiAgICovXG4gIHNxbFdoZXJlKHdoZXJlKSB7XG4gICAgaWYgKCF3aGVyZSkgcmV0dXJuXG4gICAgaWYgKHR5cGVvZiB3aGVyZSA9PT0gJ3N0cmluZycpIHJldHVybiB3aGVyZVxuXG4gICAgY29uc3Qgd2hlcmVBcnJheSA9IFtdXG5cbiAgICBmb3IgKGxldCBrZXkgaW4gd2hlcmUpIHtcbiAgICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCA9ICcgKyBteXNxbC5lc2NhcGUod2hlcmVba2V5XSkpXG4gICAgfVxuXG4gICAgcmV0dXJuICdXSEVSRSAnICsgd2hlcmVBcnJheS5qb2luKCcgQU5EICcpXG4gIH1cblxuICAvKipcbiAgICogVHVybnMge2ZpcnN0X25hbWU6ICdCcmFkJywgbGFzdF9uYW1lOiAnV2VzdGZhbGwnfSwgaW50b1xuICAgKiAgICAgICBgZmlyc3RfbmFtZWAgPSAnQnJhZCcsIGBsYXN0X25hbWVgID0gJ1dlc3RmYWxsJ1xuICAgKi9cbiAgY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcykge1xuICAgIGNvbnN0IHZhbHVlc0FycmF5ID0gW11cbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlcyA9IHRoaXMudHJhbnNmb3JtVmFsdWVzKHZhbHVlcylcblxuICAgIGZvciAobGV0IGtleSBpbiB0cmFuc2Zvcm1lZFZhbHVlcykge1xuICAgICAgY29uc3QgdmFsdWUgPSB0cmFuc2Zvcm1lZFZhbHVlc1trZXldXG4gICAgICB2YWx1ZXNBcnJheS5wdXNoKGBcXGAke2tleX1cXGAgPSAke3ZhbHVlfWApXG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlc0FycmF5LmpvaW4oKVxuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSB2YWx1ZXMgb2YgdGhlIFwidmFsdWVzXCIgYXJndW1lbnQgbWF0Y2ggdGhlIGtleXMgb2YgdGhlIHRoaXMudHJhbnNmb3Jtc1xuICAgKiBvYmplY3QsIHRoZW4gdXNlIHRoZSB0cmFuc2Zvcm1zIHZhbHVlIGluc3RlYWQgb2YgdGhlIHN1cHBsaWVkIHZhbHVlXG4gICAqL1xuICB0cmFuc2Zvcm1WYWx1ZXModmFsdWVzKSB7XG4gICAgY29uc3QgbmV3T2JqID0ge31cblxuICAgIGZvciAobGV0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gdmFsdWVzW2tleV1cbiAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuc2V0dGluZ3MudHJhbnNmb3Jtc1tyYXdWYWx1ZV1cbiAgICAgIGxldCB2YWx1ZVxuXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy50cmFuc2Zvcm1zLmhhc093blByb3BlcnR5KHJhd1ZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IHR5cGVvZiB0cmFuc2Zvcm0gPT09ICdmdW5jdGlvbicgPyB0cmFuc2Zvcm0ocmF3VmFsdWUsIHZhbHVlcykgOiB0cmFuc2Zvcm1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gbXlzcWwuZXNjYXBlKHJhd1ZhbHVlKVxuICAgICAgfVxuXG4gICAgICBuZXdPYmpba2V5XSA9IHZhbHVlXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld09ialxuICB9XG5cbiAgaXNTZWxlY3Qoc3FsKSB7XG4gICAgc3FsID0gc3FsLnRyaW0oKS50b1VwcGVyQ2FzZSgpXG4gICAgcmV0dXJuIHNxbC5tYXRjaCgvXlNFTEVDVC8pXG4gIH1cblxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgTWlkZGxld2FyZVxuICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICB1c2UodHlwZSwgbWlkZGxld2FyZSkge1xuICAgIGlmICh0eXBlb2YgbWlkZGxld2FyZSAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuXG4gICAgY29uc3QgdHlwZUFycmF5ID0gdGhpcy5taWRkbGV3YXJlW3R5cGUudG9VcHBlckNhc2UoKV1cbiAgICBpZiAoIXR5cGVBcnJheSkgcmV0dXJuXG4gICAgdHlwZUFycmF5LnB1c2gobWlkZGxld2FyZSlcbiAgfVxuXG4gIGFwcGx5TWlkZGxld2FyZSh0eXBlLCAuLi5hcmdzKSB7XG4gICAgY29uc3QgdHlwZUFycmF5ID0gdGhpcy5taWRkbGV3YXJlW3R5cGUudG9VcHBlckNhc2UoKV1cbiAgICB0eXBlQXJyYXkuZm9yRWFjaChmdW5jdGlvbihtaWRkbGV3YXJlKSB7XG4gICAgICBhcmdzID0gbWlkZGxld2FyZShhcmdzKVxuICAgIH0pXG4gICAgcmV0dXJuIGFyZ3NcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IE15U3FsXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsSUFBTSwyQkFBMkI7UUFDdkIsV0FBTjtZQUNVLEVBQVY7V0FDUyxPQUFUO2NBQ1k7ZUFDQyxNQUFYO1FBQ0ksTUFBSjthQUNTLE9BQVQ7aUJBQ2EsV0FBYjtHQUpGO0NBSkU7O0lBWUE7V0FBQSxLQUNKLENBQWEsT0FBYixFQUFzQjtzQ0FEbEIsT0FDa0I7O3VDQUNOLDBCQUE2QixRQUEzQyxDQURvQjttQkFFZ0MsUUFGaEM7UUFFYiwyQkFGYTtRQUVKLGlDQUZJO1FBRVcsOEZBRlg7O1NB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