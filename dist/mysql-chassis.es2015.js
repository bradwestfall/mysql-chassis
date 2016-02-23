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

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICBhZmZlY3RlZFJvd3M6IDAsXG4gIGluc2VydElkOiAwLFxuICBjaGFuZ2VkUm93czogMCxcbiAgcm93czogW10sXG4gIGZpZWxkczogW10sXG4gIGZpZWxkQ291bnQ6IDBcbn1cblxuY29uc3QgZGVmYXVsdENvbm5lY3Rpb25PcHRpb25zID0ge1xuICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgIHBhc3N3b3JkOiAnJyxcbiAgICBzcWxQYXRoOiAnLi9zcWwnLFxuICAgIHRyYW5zZm9ybXM6IHtcbiAgICAgIHVuZGVmaW5lZDogJ05VTEwnLFxuICAgICAgJyc6ICdOVUxMJyxcbiAgICAgICdOT1coKSc6ICdOT1coKScsXG4gICAgICAnQ1VSVElNRSgpJzogJ0NVUlRJTUUoKSdcbiAgICB9XG59XG5cbmNsYXNzIE15U3FsIHtcbiAgY29uc3RydWN0b3IgKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gey4uLmRlZmF1bHRDb25uZWN0aW9uT3B0aW9ucywgLi4ub3B0aW9uc31cbiAgICBjb25zdCB7c3FsUGF0aCwgdHJhbnNmb3JtcywgLi4uY29ubmVjdGlvbk9wdGlvbnN9ID0gb3B0aW9uc1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IG15c3FsLmNyZWF0ZUNvbm5lY3Rpb24oY29ubmVjdGlvbk9wdGlvbnMpXG4gICAgdGhpcy5zZXR0aW5ncyA9IHtzcWxQYXRoLCB0cmFuc2Zvcm1zfVxuICAgIHRoaXMubWlkZGxld2FyZSA9IHtcbiAgICAgICAgJ09OX0JFRk9SRV9RVUVSWSc6IFtdLFxuICAgICAgICAnT05fUkVTVUxUUyc6IFtdXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNxbFxuICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWVzIC0gYmluZGluZyB2YWx1ZXNcbiAgICovXG4gIHNlbGVjdChzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC5yb3dzKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnQgZnJvbSBhIGZpbGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgc2VsZWN0RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcykudGhlbihyZXN1bHQgPT4gcmVzdWx0LnJvd3MpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhbiBJTlNFUlQgc3RhdGVtZW50XG4gICAqL1xuICBpbnNlcnQodGFibGUsIHZhbHVlcyA9IHt9KSB7XG4gICAgY29uc3Qgc3FsID0gYElOU0VSVCBJTlRPIFxcYCR7dGFibGV9XFxgIFNFVCAke3RoaXMuY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcyl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIFVQREFURSBzdGF0ZW1lbnRcbiAgICovXG4gIHVwZGF0ZSh0YWJsZSwgdmFsdWVzLCB3aGVyZSkge1xuICAgIGNvbnN0IHNxbCA9IGBVUERBVEUgXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX0gJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYSBERUxFVEUgc3RhdGVtZW50XG4gICAqL1xuICBkZWxldGUodGFibGUsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYERFTEVURSBGUk9NIFxcYCR7dGFibGV9XFxgICR7dGhpcy5zcWxXaGVyZSh3aGVyZSl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwYXJlIGFuZCBydW4gYSBxdWVyeSB3aXRoIGJvdW5kIHZhbHVlcy4gUmV0dXJuIGEgcHJvbWlzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3FsXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgcXVlcnkoc3FsLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcblxuICAgICAgLy8gQXBwbHkgTWlkZGxld2FyZVxuICAgICAgW3NxbCwgdmFsdWVzXSA9IHRoaXMuYXBwbHlNaWRkbGV3YXJlKCdPTl9CRUZPUkVfUVVFUlknLCBzcWwsIHZhbHVlcylcblxuICAgICAgdmFyIGZpbmFsU3FsID0gdGhpcy5xdWVyeUZvcm1hdChzcWwsIHZhbHVlcykudHJpbSgpXG5cbiAgICAgIHRoaXMuY29ubmVjdGlvbi5xdWVyeShmaW5hbFNxbCwgKGVyciwgcm93cywgZmllbGRzID0gW10pID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaih7ZXJyLCBzcWw6IGZpbmFsU3FsfSlcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vIEFwcGx5IE1pZGRsZXdhcmVcbiAgICAgICAgICBbc3FsLCByb3dzXSA9IHRoaXMuYXBwbHlNaWRkbGV3YXJlKCdPTl9SRVNVTFRTJywgc3FsLCByb3dzKVxuXG4gICAgICAgICAgcmVzKHsgLi4ucmVzcG9uc2VPYmosIGZpZWxkcywgcm93cywgc3FsOiBmaW5hbFNxbCB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBxdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcyA9IHt9KSB7XG4gICAgLy8gR2V0IGZ1bGwgcGF0aFxuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguam9pbihcbiAgICAgIHRoaXMuc2V0dGluZ3Muc3FsUGF0aCxcbiAgICAgIGZpbGVuYW1lICsgKHBhdGguZXh0bmFtZShmaWxlbmFtZSkgPT09ICcuc3FsJyA/ICcnIDogJy5zcWwnKVxuICAgICkpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAvLyBSZWFkIGZpbGUgYW5kIGV4ZWN1dGUgYXMgU1FMIHN0YXRlbWVudFxuICAgICAgZnMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGY4JywgKGVyciwgc3FsKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooJ0Nhbm5vdCBmaW5kOiAnICsgZXJyLnBhdGgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3FsID0gc3FsLnRyaW0oKVxuICAgICAgICAgIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzKS5jYXRjaChyZWopXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgSGVscGVyIEZ1bmN0aW9uc1xuICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogVHVybnMgYFNFTEVDVCAqIEZST00gdXNlciBXSEVSRSB1c2VyX2lkID0gOnVzZXJfaWRgLCBpbnRvXG4gICAqICAgICAgIGBTRUxFQ1QgKiBGUk9NIHVzZXIgV0hFUkUgdXNlcl9pZCA9IDFgXG4gICAqL1xuICBxdWVyeUZvcm1hdChxdWVyeSwgdmFsdWVzKSB7XG4gICAgaWYgKCF2YWx1ZXMpIHJldHVybiBxdWVyeVxuXG4gICAgcmV0dXJuIHF1ZXJ5LnJlcGxhY2UoL1xcOihcXHcrKS9nbSwgKHR4dCwga2V5KSA9PlxuICAgICAgdmFsdWVzLmhhc093blByb3BlcnR5KGtleSkgPyBteXNxbC5lc2NhcGUodmFsdWVzW2tleV0pIDogdHh0XG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIHt1c2VyX2lkOiAxLCBhZ2U6IDMwfSwgaW50b1xuICAgKiAgICAgICBcIldIRVJFIHVzZXJfaWQgPSAxIEFORCBhZ2UgPSAzMFwiXG4gICAqL1xuICBzcWxXaGVyZSh3aGVyZSkge1xuICAgIGlmICghd2hlcmUpIHJldHVyblxuICAgIGlmICh0eXBlb2Ygd2hlcmUgPT09ICdzdHJpbmcnKSByZXR1cm4gd2hlcmVcblxuICAgIGNvbnN0IHdoZXJlQXJyYXkgPSBbXVxuXG4gICAgZm9yIChsZXQga2V5IGluIHdoZXJlKSB7XG4gICAgICB3aGVyZUFycmF5LnB1c2goJ2AnICsga2V5ICsgJ2AgPSAnICsgbXlzcWwuZXNjYXBlKHdoZXJlW2tleV0pKVxuICAgIH1cblxuICAgIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIHtmaXJzdF9uYW1lOiAnQnJhZCcsIGxhc3RfbmFtZTogJ1dlc3RmYWxsJ30sIGludG9cbiAgICogICAgICAgYGZpcnN0X25hbWVgID0gJ0JyYWQnLCBgbGFzdF9uYW1lYCA9ICdXZXN0ZmFsbCdcbiAgICovXG4gIGNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpIHtcbiAgICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZXMgPSB0aGlzLnRyYW5zZm9ybVZhbHVlcyh2YWx1ZXMpXG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdHJhbnNmb3JtZWRWYWx1ZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdHJhbnNmb3JtZWRWYWx1ZXNba2V5XVxuICAgICAgdmFsdWVzQXJyYXkucHVzaChgXFxgJHtrZXl9XFxgID0gJHt2YWx1ZX1gKVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgdmFsdWVzIG9mIHRoZSBcInZhbHVlc1wiIGFyZ3VtZW50IG1hdGNoIHRoZSBrZXlzIG9mIHRoZSB0aGlzLnRyYW5zZm9ybXNcbiAgICogb2JqZWN0LCB0aGVuIHVzZSB0aGUgdHJhbnNmb3JtcyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBzdXBwbGllZCB2YWx1ZVxuICAgKi9cbiAgdHJhbnNmb3JtVmFsdWVzKHZhbHVlcykge1xuICAgIGNvbnN0IG5ld09iaiA9IHt9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICBjb25zdCByYXdWYWx1ZSA9IHZhbHVlc1trZXldXG4gICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLnNldHRpbmdzLnRyYW5zZm9ybXNbcmF3VmFsdWVdXG4gICAgICBsZXQgdmFsdWVcblxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudHJhbnNmb3Jtcy5oYXNPd25Qcm9wZXJ0eShyYXdWYWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSB0eXBlb2YgdHJhbnNmb3JtID09PSAnZnVuY3Rpb24nID8gdHJhbnNmb3JtKHJhd1ZhbHVlLCB2YWx1ZXMpIDogdHJhbnNmb3JtXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IG15c3FsLmVzY2FwZShyYXdWYWx1ZSlcbiAgICAgIH1cblxuICAgICAgbmV3T2JqW2tleV0gPSB2YWx1ZVxuICAgIH1cblxuICAgIHJldHVybiBuZXdPYmpcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgTWlkZGxld2FyZVxuICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICB1c2UodHlwZSwgbWlkZGxld2FyZSkge1xuICAgIGlmICh0eXBlb2YgbWlkZGxld2FyZSAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuXG4gICAgY29uc3QgdHlwZUFycmF5ID0gdGhpcy5taWRkbGV3YXJlW3R5cGUudG9VcHBlckNhc2UoKV1cbiAgICBpZiAoIXR5cGVBcnJheSkgcmV0dXJuXG4gICAgdHlwZUFycmF5LnB1c2gobWlkZGxld2FyZSlcbiAgfVxuXG4gIGFwcGx5TWlkZGxld2FyZSh0eXBlLCAuLi5hcmdzKSB7XG4gICAgY29uc3QgdHlwZUFycmF5ID0gdGhpcy5taWRkbGV3YXJlW3R5cGUudG9VcHBlckNhc2UoKV1cbiAgICB0eXBlQXJyYXkuZm9yRWFjaChmdW5jdGlvbihtaWRkbGV3YXJlKSB7XG4gICAgICBhcmdzID0gbWlkZGxld2FyZShhcmdzKVxuICAgIH0pXG4gICAgcmV0dXJuIGFyZ3NcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IE15U3FsXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsSUFBTSxjQUFjO2dCQUNKLENBQWQ7WUFDVSxDQUFWO2VBQ2EsQ0FBYjtRQUNNLEVBQU47VUFDUSxFQUFSO2NBQ1ksQ0FBWjtDQU5JOztBQVNOLElBQU0sMkJBQTJCO1FBQ3ZCLFdBQU47WUFDVSxFQUFWO1dBQ1MsT0FBVDtjQUNZO2VBQ0MsTUFBWDtRQUNJLE1BQUo7YUFDUyxPQUFUO2lCQUNhLFdBQWI7R0FKRjtDQUpFOztJQVlBO1dBQUEsS0FDSixDQUFhLE9BQWIsRUFBc0I7c0NBRGxCLE9BQ2tCOzt1Q0FDTiwwQkFBNkIsUUFBM0MsQ0FEb0I7bUJBRWdDLFFBRmhDO1FBRWIsMkJBRmE7UUFFSixpQ0FGSTtRQUVXLDhGQUZYOztTQUdmLFVBQUwsR0FBa0IsTUFBTSxnQkFBTixDQUF1QixpQkFBdkIsQ0FBbEIsQ0FIb0I7U0FJZixRQUFMLEdBQWdCLEVBQUMsZ0JBQUQsRUFBVSxzQkFBVixFQUFoQixDQUpvQjtTQUtmLFVBQUwsR0FBa0I7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