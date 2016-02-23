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

var responseObj = {
  affectedRows: 0,
  insertId: 0,
  changedRows: 0,
  rows: [],
  fields: [],
  fieldCount: 0
};

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
    this.connection = mysql.createConnection(options);
    this.settings = {};
    this.settings.sqlPath = options.sqlPath;
    this.settings.transforms = options.transforms;
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

      return this.query(sql, values).then(function (result) {
        return result.rows;
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

      return this.queryFile(filename, values).then(function (result) {
        return result.rows;
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

        _this.connection.query(finalSql, function (err, rows) {
          var fields = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

          if (err) {
            rej({ err: err, sql: finalSql });
          } else {
            var _applyMiddleware3 = _this.applyMiddleware('ON_RESULTS', sql, rows);

            // Apply Middleware


            var _applyMiddleware4 = babelHelpers.slicedToArray(_applyMiddleware3, 2);

            sql = _applyMiddleware4[0];
            rows = _applyMiddleware4[1];


            res(babelHelpers.extends({}, responseObj, { fields: fields, rows: rows, sql: finalSql }));
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

module.exports = MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5qcyIsInNvdXJjZXMiOlsiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gIGFmZmVjdGVkUm93czogMCxcbiAgaW5zZXJ0SWQ6IDAsXG4gIGNoYW5nZWRSb3dzOiAwLFxuICByb3dzOiBbXSxcbiAgZmllbGRzOiBbXSxcbiAgZmllbGRDb3VudDogMFxufVxuXG5jb25zdCBkZWZhdWx0Q29ubmVjdGlvbk9wdGlvbnMgPSB7XG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgcGFzc3dvcmQ6ICcnLFxuICAgIHNxbFBhdGg6ICcuL3NxbCcsXG4gICAgdHJhbnNmb3Jtczoge1xuICAgICAgdW5kZWZpbmVkOiAnTlVMTCcsXG4gICAgICAnJzogJ05VTEwnLFxuICAgICAgJ05PVygpJzogJ05PVygpJyxcbiAgICAgICdDVVJUSU1FKCknOiAnQ1VSVElNRSgpJ1xuICAgIH1cbn1cblxuY2xhc3MgTXlTcWwge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7Li4uZGVmYXVsdENvbm5lY3Rpb25PcHRpb25zLCAuLi5vcHRpb25zfVxuICAgIHRoaXMuY29ubmVjdGlvbiA9IG15c3FsLmNyZWF0ZUNvbm5lY3Rpb24ob3B0aW9ucylcbiAgICB0aGlzLnNldHRpbmdzID0ge31cbiAgICB0aGlzLnNldHRpbmdzLnNxbFBhdGggPSBvcHRpb25zLnNxbFBhdGhcbiAgICB0aGlzLnNldHRpbmdzLnRyYW5zZm9ybXMgPSBvcHRpb25zLnRyYW5zZm9ybXNcbiAgICB0aGlzLm1pZGRsZXdhcmUgPSB7XG4gICAgICAgICdPTl9CRUZPUkVfUVVFUlknOiBbXSxcbiAgICAgICAgJ09OX1JFU1VMVFMnOiBbXVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBTRUxFQ1Qgc3RhdGVtZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzcWxcbiAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlcyAtIGJpbmRpbmcgdmFsdWVzXG4gICAqL1xuICBzZWxlY3Qoc3FsLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbCwgdmFsdWVzKS50aGVuKHJlc3VsdCA9PiByZXN1bHQucm93cylcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBTRUxFQ1Qgc3RhdGVtZW50IGZyb20gYSBmaWxlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZVxuICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWVzIC0gYmluZGluZyB2YWx1ZXNcbiAgICovXG4gIHNlbGVjdEZpbGUoZmlsZW5hbWUsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnlGaWxlKGZpbGVuYW1lLCB2YWx1ZXMpLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC5yb3dzKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYW4gSU5TRVJUIHN0YXRlbWVudFxuICAgKi9cbiAgaW5zZXJ0KHRhYmxlLCB2YWx1ZXMgPSB7fSkge1xuICAgIGNvbnN0IHNxbCA9IGBJTlNFUlQgSU5UTyBcXGAke3RhYmxlfVxcYCBTRVQgJHt0aGlzLmNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhbiBVUERBVEUgc3RhdGVtZW50XG4gICAqL1xuICB1cGRhdGUodGFibGUsIHZhbHVlcywgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgVVBEQVRFIFxcYCR7dGFibGV9XFxgIFNFVCAke3RoaXMuY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcyl9ICR7dGhpcy5zcWxXaGVyZSh3aGVyZSl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGEgREVMRVRFIHN0YXRlbWVudFxuICAgKi9cbiAgZGVsZXRlKHRhYmxlLCB3aGVyZSkge1xuICAgIGNvbnN0IHNxbCA9IGBERUxFVEUgRlJPTSBcXGAke3RhYmxlfVxcYCAke3RoaXMuc3FsV2hlcmUod2hlcmUpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogUHJlcGFyZSBhbmQgcnVuIGEgcXVlcnkgd2l0aCBib3VuZCB2YWx1ZXMuIFJldHVybiBhIHByb21pc2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNxbFxuICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWVzIC0gYmluZGluZyB2YWx1ZXNcbiAgICovXG4gIHF1ZXJ5KHNxbCwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG5cbiAgICAgIC8vIEFwcGx5IE1pZGRsZXdhcmVcbiAgICAgIFtzcWwsIHZhbHVlc10gPSB0aGlzLmFwcGx5TWlkZGxld2FyZSgnT05fQkVGT1JFX1FVRVJZJywgc3FsLCB2YWx1ZXMpXG5cbiAgICAgIHZhciBmaW5hbFNxbCA9IHRoaXMucXVlcnlGb3JtYXQoc3FsLCB2YWx1ZXMpLnRyaW0oKVxuXG4gICAgICB0aGlzLmNvbm5lY3Rpb24ucXVlcnkoZmluYWxTcWwsIChlcnIsIHJvd3MsIGZpZWxkcyA9IFtdKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooe2Vyciwgc3FsOiBmaW5hbFNxbH0pXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAvLyBBcHBseSBNaWRkbGV3YXJlXG4gICAgICAgICAgW3NxbCwgcm93c10gPSB0aGlzLmFwcGx5TWlkZGxld2FyZSgnT05fUkVTVUxUUycsIHNxbCwgcm93cylcblxuICAgICAgICAgIHJlcyh7IC4uLnJlc3BvbnNlT2JqLCBmaWVsZHMsIHJvd3MsIHNxbDogZmluYWxTcWwgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgcXVlcnlGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuICAgIC8vIEdldCBmdWxsIHBhdGhcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmpvaW4oXG4gICAgICB0aGlzLnNldHRpbmdzLnNxbFBhdGgsXG4gICAgICBmaWxlbmFtZSArIChwYXRoLmV4dG5hbWUoZmlsZW5hbWUpID09PSAnLnNxbCcgPyAnJyA6ICcuc3FsJylcbiAgICApKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgLy8gUmVhZCBmaWxlIGFuZCBleGVjdXRlIGFzIFNRTCBzdGF0ZW1lbnRcbiAgICAgIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmOCcsIChlcnIsIHNxbCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKCdDYW5ub3QgZmluZDogJyArIGVyci5wYXRoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNxbCA9IHNxbC50cmltKClcbiAgICAgICAgICB0aGlzLnF1ZXJ5KHNxbCwgdmFsdWVzKS50aGVuKHJlcykuY2F0Y2gocmVqKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIEhlbHBlciBGdW5jdGlvbnNcbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIFR1cm5zIGBTRUxFQ1QgKiBGUk9NIHVzZXIgV0hFUkUgdXNlcl9pZCA9IDp1c2VyX2lkYCwgaW50b1xuICAgKiAgICAgICBgU0VMRUNUICogRlJPTSB1c2VyIFdIRVJFIHVzZXJfaWQgPSAxYFxuICAgKi9cbiAgcXVlcnlGb3JtYXQocXVlcnksIHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSByZXR1cm4gcXVlcnlcblxuICAgIHJldHVybiBxdWVyeS5yZXBsYWNlKC9cXDooXFx3KykvZ20sICh0eHQsIGtleSkgPT5cbiAgICAgIHZhbHVlcy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSA6IHR4dFxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJucyB7dXNlcl9pZDogMSwgYWdlOiAzMH0sIGludG9cbiAgICogICAgICAgXCJXSEVSRSB1c2VyX2lkID0gMSBBTkQgYWdlID0gMzBcIlxuICAgKi9cbiAgc3FsV2hlcmUod2hlcmUpIHtcbiAgICBpZiAoIXdoZXJlKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHdoZXJlID09PSAnc3RyaW5nJykgcmV0dXJuIHdoZXJlXG5cbiAgICBjb25zdCB3aGVyZUFycmF5ID0gW11cblxuICAgIGZvciAobGV0IGtleSBpbiB3aGVyZSkge1xuICAgICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh3aGVyZVtrZXldKSlcbiAgICB9XG5cbiAgICByZXR1cm4gJ1dIRVJFICcgKyB3aGVyZUFycmF5LmpvaW4oJyBBTkQgJylcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJucyB7Zmlyc3RfbmFtZTogJ0JyYWQnLCBsYXN0X25hbWU6ICdXZXN0ZmFsbCd9LCBpbnRvXG4gICAqICAgICAgIGBmaXJzdF9uYW1lYCA9ICdCcmFkJywgYGxhc3RfbmFtZWAgPSAnV2VzdGZhbGwnXG4gICAqL1xuICBjcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKSB7XG4gICAgY29uc3QgdmFsdWVzQXJyYXkgPSBbXVxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWVzID0gdGhpcy50cmFuc2Zvcm1WYWx1ZXModmFsdWVzKVxuXG4gICAgZm9yIChsZXQga2V5IGluIHRyYW5zZm9ybWVkVmFsdWVzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRyYW5zZm9ybWVkVmFsdWVzW2tleV1cbiAgICAgIHZhbHVlc0FycmF5LnB1c2goYFxcYCR7a2V5fVxcYCA9ICR7dmFsdWV9YClcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVzQXJyYXkuam9pbigpXG4gIH1cblxuICAvKipcbiAgICogSWYgdGhlIHZhbHVlcyBvZiB0aGUgXCJ2YWx1ZXNcIiBhcmd1bWVudCBtYXRjaCB0aGUga2V5cyBvZiB0aGUgdGhpcy50cmFuc2Zvcm1zXG4gICAqIG9iamVjdCwgdGhlbiB1c2UgdGhlIHRyYW5zZm9ybXMgdmFsdWUgaW5zdGVhZCBvZiB0aGUgc3VwcGxpZWQgdmFsdWVcbiAgICovXG4gIHRyYW5zZm9ybVZhbHVlcyh2YWx1ZXMpIHtcbiAgICBjb25zdCBuZXdPYmogPSB7fVxuXG4gICAgZm9yIChsZXQga2V5IGluIHZhbHVlcykge1xuICAgICAgY29uc3QgcmF3VmFsdWUgPSB2YWx1ZXNba2V5XVxuICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5zZXR0aW5ncy50cmFuc2Zvcm1zW3Jhd1ZhbHVlXVxuICAgICAgbGV0IHZhbHVlXG5cbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRyYW5zZm9ybXMuaGFzT3duUHJvcGVydHkocmF3VmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gdHlwZW9mIHRyYW5zZm9ybSA9PT0gJ2Z1bmN0aW9uJyA/IHRyYW5zZm9ybShyYXdWYWx1ZSwgdmFsdWVzKSA6IHRyYW5zZm9ybVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBteXNxbC5lc2NhcGUocmF3VmFsdWUpXG4gICAgICB9XG5cbiAgICAgIG5ld09ialtrZXldID0gdmFsdWVcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3T2JqXG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIE1pZGRsZXdhcmVcbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgdXNlKHR5cGUsIG1pZGRsZXdhcmUpIHtcbiAgICBpZiAodHlwZW9mIG1pZGRsZXdhcmUgIT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIGNvbnN0IHR5cGVBcnJheSA9IHRoaXMubWlkZGxld2FyZVt0eXBlLnRvVXBwZXJDYXNlKCldXG4gICAgaWYgKCF0eXBlQXJyYXkpIHJldHVyblxuICAgIHR5cGVBcnJheS5wdXNoKG1pZGRsZXdhcmUpXG4gIH1cblxuICBhcHBseU1pZGRsZXdhcmUodHlwZSwgLi4uYXJncykge1xuICAgIGNvbnN0IHR5cGVBcnJheSA9IHRoaXMubWlkZGxld2FyZVt0eXBlLnRvVXBwZXJDYXNlKCldXG4gICAgdHlwZUFycmF5LmZvckVhY2goZnVuY3Rpb24obWlkZGxld2FyZSkge1xuICAgICAgYXJncyA9IG1pZGRsZXdhcmUoYXJncylcbiAgICB9KVxuICAgIHJldHVybiBhcmdzXG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVNxbFxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsSUFBTSxjQUFjO2dCQUNKLENBQWQ7WUFDVSxDQUFWO2VBQ2EsQ0FBYjtRQUNNLEVBQU47VUFDUSxFQUFSO2NBQ1ksQ0FBWjtDQU5JOztBQVNOLElBQU0sMkJBQTJCO1FBQ3ZCLFdBQU47WUFDVSxFQUFWO1dBQ1MsT0FBVDtjQUNZO2VBQ0MsTUFBWDtRQUNJLE1BQUo7YUFDUyxPQUFUO2lCQUNhLFdBQWI7R0FKRjtDQUpFOztJQVlBO1dBQUEsS0FDSixDQUFhLE9BQWIsRUFBc0I7c0NBRGxCLE9BQ2tCOzt1Q0FDTiwwQkFBNkIsUUFBM0MsQ0FEb0I7U0FFZixVQUFMLEdBQWtCLE1BQU0sZ0JBQU4sQ0FBdUIsT0FBdkIsQ0FBbEIsQ0FGb0I7U0FHZixRQUFMLEdBQWdCLEVBQWhCLENBSG9CO1NBSWYsUUFBTCxDQUFjLE9BQWQsR0FBd0IsUUFBUSxPQUFSLENBSko7U0FLZixRQUFMLENBQWMsVUFBZCxHQUEyQixRQUFRLFVBQVIsQ0FMUDtTQU1mLFVBQUwsR0FBa0I7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