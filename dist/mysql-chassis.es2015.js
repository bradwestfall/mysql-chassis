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

      return this.query(sql, values); //.then(result => result.rows)
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

      return this.queryFile(filename, values); //.then(result => result.rows)
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
              res(babelHelpers.extends({}, responseObj, results, { sql: finalSql }));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICBhZmZlY3RlZFJvd3M6IDAsXG4gIGluc2VydElkOiAwLFxuICBjaGFuZ2VkUm93czogMCxcbiAgZmllbGRDb3VudDogMFxufVxuXG5jb25zdCBkZWZhdWx0Q29ubmVjdGlvbk9wdGlvbnMgPSB7XG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgcGFzc3dvcmQ6ICcnLFxuICAgIHNxbFBhdGg6ICcuL3NxbCcsXG4gICAgdHJhbnNmb3Jtczoge1xuICAgICAgdW5kZWZpbmVkOiAnTlVMTCcsXG4gICAgICAnJzogJ05VTEwnLFxuICAgICAgJ05PVygpJzogJ05PVygpJyxcbiAgICAgICdDVVJUSU1FKCknOiAnQ1VSVElNRSgpJ1xuICAgIH1cbn1cblxuY2xhc3MgTXlTcWwge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7Li4uZGVmYXVsdENvbm5lY3Rpb25PcHRpb25zLCAuLi5vcHRpb25zfVxuICAgIGNvbnN0IHtzcWxQYXRoLCB0cmFuc2Zvcm1zLCAuLi5jb25uZWN0aW9uT3B0aW9uc30gPSBvcHRpb25zXG4gICAgdGhpcy5jb25uZWN0aW9uID0gbXlzcWwuY3JlYXRlQ29ubmVjdGlvbihjb25uZWN0aW9uT3B0aW9ucylcbiAgICB0aGlzLnNldHRpbmdzID0ge3NxbFBhdGgsIHRyYW5zZm9ybXN9XG4gICAgdGhpcy5taWRkbGV3YXJlID0ge1xuICAgICAgICAnT05fQkVGT1JFX1FVRVJZJzogW10sXG4gICAgICAgICdPTl9SRVNVTFRTJzogW11cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3FsXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgc2VsZWN0KHNxbCwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwsIHZhbHVlcykgLy8udGhlbihyZXN1bHQgPT4gcmVzdWx0LnJvd3MpXG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudCBmcm9tIGEgZmlsZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlcyAtIGJpbmRpbmcgdmFsdWVzXG4gICAqL1xuICBzZWxlY3RGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5RmlsZShmaWxlbmFtZSwgdmFsdWVzKSAvLy50aGVuKHJlc3VsdCA9PiByZXN1bHQucm93cylcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIElOU0VSVCBzdGF0ZW1lbnRcbiAgICovXG4gIGluc2VydCh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYW4gVVBEQVRFIHN0YXRlbWVudFxuICAgKi9cbiAgdXBkYXRlKHRhYmxlLCB2YWx1ZXMsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYFVQREFURSBcXGAke3RhYmxlfVxcYCBTRVQgJHt0aGlzLmNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpfSAke3RoaXMuc3FsV2hlcmUod2hlcmUpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhIERFTEVURSBzdGF0ZW1lbnRcbiAgICovXG4gIGRlbGV0ZSh0YWJsZSwgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgREVMRVRFIEZST00gXFxgJHt0YWJsZX1cXGAgJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIFByZXBhcmUgYW5kIHJ1biBhIHF1ZXJ5IHdpdGggYm91bmQgdmFsdWVzLiBSZXR1cm4gYSBwcm9taXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzcWxcbiAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlcyAtIGJpbmRpbmcgdmFsdWVzXG4gICAqL1xuICBxdWVyeShzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuXG4gICAgICAvLyBBcHBseSBNaWRkbGV3YXJlXG4gICAgICBbc3FsLCB2YWx1ZXNdID0gdGhpcy5hcHBseU1pZGRsZXdhcmUoJ09OX0JFRk9SRV9RVUVSWScsIHNxbCwgdmFsdWVzKVxuXG4gICAgICBsZXQgZmluYWxTcWwgPSB0aGlzLnF1ZXJ5Rm9ybWF0KHNxbCwgdmFsdWVzKS50cmltKClcblxuICAgICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KGZpbmFsU3FsLCAoZXJyLCByZXN1bHRzLCBmaWVsZHMpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaih7ZXJyLCBzcWw6IGZpbmFsU3FsfSlcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vIEFwcGx5IE1pZGRsZXdhcmVcbiAgICAgICAgICBbc3FsLCByZXN1bHRzXSA9IHRoaXMuYXBwbHlNaWRkbGV3YXJlKCdPTl9SRVNVTFRTJywgc3FsLCByZXN1bHRzKVxuXG4gICAgICAgICAgLy8gSWYgc3FsIGlzIFNFTEVDVFxuICAgICAgICAgIGlmICh0aGlzLmlzU2VsZWN0KGZpbmFsU3FsKSkge1xuXG4gICAgICAgICAgICAvLyBSZXN1bHRzIGlzIHJvd3MgaW4gdGhlIGNhc2Ugb2YgU0VMRUNUIHN0YXRlbWVudHNcbiAgICAgICAgICAgIHJlcyh7IHJvd3M6IHJlc3VsdHMsIGZpZWxkcywgc3FsOiBmaW5hbFNxbH0pXG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzKHsgLi4ucmVzcG9uc2VPYmosIC4uLnJlc3VsdHMsIHNxbDogZmluYWxTcWwgfSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgcXVlcnlGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuXG4gICAgLy8gR2V0IGZ1bGwgcGF0aFxuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguam9pbihcbiAgICAgIHRoaXMuc2V0dGluZ3Muc3FsUGF0aCxcbiAgICAgIGZpbGVuYW1lICsgKHBhdGguZXh0bmFtZShmaWxlbmFtZSkgPT09ICcuc3FsJyA/ICcnIDogJy5zcWwnKVxuICAgICkpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAvLyBSZWFkIGZpbGUgYW5kIGV4ZWN1dGUgYXMgU1FMIHN0YXRlbWVudFxuICAgICAgZnMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGY4JywgKGVyciwgc3FsKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooJ0Nhbm5vdCBmaW5kOiAnICsgZXJyLnBhdGgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3FsID0gc3FsLnRyaW0oKVxuICAgICAgICAgIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzKS5jYXRjaChyZWopXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgSGVscGVyIEZ1bmN0aW9uc1xuICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogVHVybnMgYFNFTEVDVCAqIEZST00gdXNlciBXSEVSRSB1c2VyX2lkID0gOnVzZXJfaWRgLCBpbnRvXG4gICAqICAgICAgIGBTRUxFQ1QgKiBGUk9NIHVzZXIgV0hFUkUgdXNlcl9pZCA9IDFgXG4gICAqL1xuICBxdWVyeUZvcm1hdChxdWVyeSwgdmFsdWVzKSB7XG4gICAgaWYgKCF2YWx1ZXMpIHJldHVybiBxdWVyeVxuXG4gICAgcmV0dXJuIHF1ZXJ5LnJlcGxhY2UoL1xcOihcXHcrKS9nbSwgKHR4dCwga2V5KSA9PlxuICAgICAgdmFsdWVzLmhhc093blByb3BlcnR5KGtleSkgPyBteXNxbC5lc2NhcGUodmFsdWVzW2tleV0pIDogdHh0XG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIHt1c2VyX2lkOiAxLCBhZ2U6IDMwfSwgaW50b1xuICAgKiAgICAgICBcIldIRVJFIHVzZXJfaWQgPSAxIEFORCBhZ2UgPSAzMFwiXG4gICAqL1xuICBzcWxXaGVyZSh3aGVyZSkge1xuICAgIGlmICghd2hlcmUpIHJldHVyblxuICAgIGlmICh0eXBlb2Ygd2hlcmUgPT09ICdzdHJpbmcnKSByZXR1cm4gd2hlcmVcblxuICAgIGNvbnN0IHdoZXJlQXJyYXkgPSBbXVxuXG4gICAgZm9yIChsZXQga2V5IGluIHdoZXJlKSB7XG4gICAgICB3aGVyZUFycmF5LnB1c2goJ2AnICsga2V5ICsgJ2AgPSAnICsgbXlzcWwuZXNjYXBlKHdoZXJlW2tleV0pKVxuICAgIH1cblxuICAgIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIHtmaXJzdF9uYW1lOiAnQnJhZCcsIGxhc3RfbmFtZTogJ1dlc3RmYWxsJ30sIGludG9cbiAgICogICAgICAgYGZpcnN0X25hbWVgID0gJ0JyYWQnLCBgbGFzdF9uYW1lYCA9ICdXZXN0ZmFsbCdcbiAgICovXG4gIGNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpIHtcbiAgICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZXMgPSB0aGlzLnRyYW5zZm9ybVZhbHVlcyh2YWx1ZXMpXG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdHJhbnNmb3JtZWRWYWx1ZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdHJhbnNmb3JtZWRWYWx1ZXNba2V5XVxuICAgICAgdmFsdWVzQXJyYXkucHVzaChgXFxgJHtrZXl9XFxgID0gJHt2YWx1ZX1gKVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgdmFsdWVzIG9mIHRoZSBcInZhbHVlc1wiIGFyZ3VtZW50IG1hdGNoIHRoZSBrZXlzIG9mIHRoZSB0aGlzLnRyYW5zZm9ybXNcbiAgICogb2JqZWN0LCB0aGVuIHVzZSB0aGUgdHJhbnNmb3JtcyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBzdXBwbGllZCB2YWx1ZVxuICAgKi9cbiAgdHJhbnNmb3JtVmFsdWVzKHZhbHVlcykge1xuICAgIGNvbnN0IG5ld09iaiA9IHt9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICBjb25zdCByYXdWYWx1ZSA9IHZhbHVlc1trZXldXG4gICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLnNldHRpbmdzLnRyYW5zZm9ybXNbcmF3VmFsdWVdXG4gICAgICBsZXQgdmFsdWVcblxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudHJhbnNmb3Jtcy5oYXNPd25Qcm9wZXJ0eShyYXdWYWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSB0eXBlb2YgdHJhbnNmb3JtID09PSAnZnVuY3Rpb24nID8gdHJhbnNmb3JtKHJhd1ZhbHVlLCB2YWx1ZXMpIDogdHJhbnNmb3JtXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IG15c3FsLmVzY2FwZShyYXdWYWx1ZSlcbiAgICAgIH1cblxuICAgICAgbmV3T2JqW2tleV0gPSB2YWx1ZVxuICAgIH1cblxuICAgIHJldHVybiBuZXdPYmpcbiAgfVxuXG4gIGlzU2VsZWN0KHNxbCkge1xuICAgIHNxbCA9IHNxbC50cmltKCkudG9VcHBlckNhc2UoKVxuICAgIHJldHVybiBzcWwubWF0Y2goL15TRUxFQ1QvKVxuICB9XG5cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIE1pZGRsZXdhcmVcbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgdXNlKHR5cGUsIG1pZGRsZXdhcmUpIHtcbiAgICBpZiAodHlwZW9mIG1pZGRsZXdhcmUgIT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIGNvbnN0IHR5cGVBcnJheSA9IHRoaXMubWlkZGxld2FyZVt0eXBlLnRvVXBwZXJDYXNlKCldXG4gICAgaWYgKCF0eXBlQXJyYXkpIHJldHVyblxuICAgIHR5cGVBcnJheS5wdXNoKG1pZGRsZXdhcmUpXG4gIH1cblxuICBhcHBseU1pZGRsZXdhcmUodHlwZSwgLi4uYXJncykge1xuICAgIGNvbnN0IHR5cGVBcnJheSA9IHRoaXMubWlkZGxld2FyZVt0eXBlLnRvVXBwZXJDYXNlKCldXG4gICAgdHlwZUFycmF5LmZvckVhY2goZnVuY3Rpb24obWlkZGxld2FyZSkge1xuICAgICAgYXJncyA9IG1pZGRsZXdhcmUoYXJncylcbiAgICB9KVxuICAgIHJldHVybiBhcmdzXG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVNxbFxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLElBQU0sY0FBYztnQkFDSixDQUFkO1lBQ1UsQ0FBVjtlQUNhLENBQWI7Y0FDWSxDQUFaO0NBSkk7O0FBT04sSUFBTSwyQkFBMkI7UUFDdkIsV0FBTjtZQUNVLEVBQVY7V0FDUyxP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