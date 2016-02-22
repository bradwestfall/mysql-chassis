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

babelHelpers;

var responseObj = {
  fieldCount: 0,
  affectedRows: 0,
  insertId: 0,
  changedRows: 0,
  rows: [],
  fields: []
};

var MySql = function () {
  function MySql() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? { host: 'localhost' } : arguments[0];
    babelHelpers.classCallCheck(this, MySql);

    this.connection = mysql.createConnection(options);
    this.sqlPath = options.sqlPath || './sql';
    this.transforms = options.transforms || {};
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
        var finalSql = _this.queryFormat(sql, values).trim();
        _this.connection.query(sql, function (err, rows) {
          var fields = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

          if (err) {
            rej(err);
          } else {
            // add rows directly if it's an array, otherwise assign them in
            res(rows.length ? babelHelpers.extends({}, responseObj, { fields: fields, rows: rows, sql: finalSql }) : babelHelpers.extends({}, responseObj, { fields: fields }, rows, { sql: finalSql }));
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
      var filePath = path.resolve(path.join(this.sqlPath, filename + (path.extname(filename) === '.sql' ? '' : '.sql')));

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
        var transform = this.transforms[rawValue];
        var value = undefined;

        if (this.transforms.hasOwnProperty(rawValue)) {
          value = typeof transform === 'function' ? transform(rawValue, values) : transform;
        } else {
          value = mysql.escape(rawValue);
        }

        newObj[key] = value;
      }

      return newObj;
    }
  }]);
  return MySql;
}();

module.exports = MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5qcyIsInNvdXJjZXMiOlsiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gIGZpZWxkQ291bnQ6IDAsXG4gIGFmZmVjdGVkUm93czogMCxcbiAgaW5zZXJ0SWQ6IDAsXG4gIGNoYW5nZWRSb3dzOiAwLFxuICByb3dzOiBbXSxcbiAgZmllbGRzOiBbXVxufVxuXG5jbGFzcyBNeVNxbCB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zID0geyBob3N0OiAnbG9jYWxob3N0JyB9KSB7XG4gICAgdGhpcy5jb25uZWN0aW9uID0gbXlzcWwuY3JlYXRlQ29ubmVjdGlvbihvcHRpb25zKVxuICAgIHRoaXMuc3FsUGF0aCA9IG9wdGlvbnMuc3FsUGF0aCB8fCAnLi9zcWwnXG4gICAgdGhpcy50cmFuc2Zvcm1zID0gb3B0aW9ucy50cmFuc2Zvcm1zIHx8IHt9XG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3FsXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgc2VsZWN0KHNxbCwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwsIHZhbHVlcykudGhlbihyZXN1bHQgPT4gcmVzdWx0LnJvd3MpXG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudCBmcm9tIGEgZmlsZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlcyAtIGJpbmRpbmcgdmFsdWVzXG4gICAqL1xuICBzZWxlY3RGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5RmlsZShmaWxlbmFtZSwgdmFsdWVzKS50aGVuKHJlc3VsdCA9PiByZXN1bHQucm93cylcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIElOU0VSVCBzdGF0ZW1lbnRcbiAgICovXG4gIGluc2VydCh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYW4gVVBEQVRFIHN0YXRlbWVudFxuICAgKi9cbiAgdXBkYXRlKHRhYmxlLCB2YWx1ZXMsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYFVQREFURSBcXGAke3RhYmxlfVxcYCBTRVQgJHt0aGlzLmNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpfSAke3RoaXMuc3FsV2hlcmUod2hlcmUpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhIERFTEVURSBzdGF0ZW1lbnRcbiAgICovXG4gIGRlbGV0ZSh0YWJsZSwgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgREVMRVRFIEZST00gXFxgJHt0YWJsZX1cXGAgJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIFByZXBhcmUgYW5kIHJ1biBhIHF1ZXJ5IHdpdGggYm91bmQgdmFsdWVzLiBSZXR1cm4gYSBwcm9taXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzcWxcbiAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlcyAtIGJpbmRpbmcgdmFsdWVzXG4gICAqL1xuICBxdWVyeShzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdmFyIGZpbmFsU3FsID0gdGhpcy5xdWVyeUZvcm1hdChzcWwsIHZhbHVlcykudHJpbSgpXG4gICAgICB0aGlzLmNvbm5lY3Rpb24ucXVlcnkoc3FsLCAoZXJyLCByb3dzLCBmaWVsZHMgPSBbXSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKGVycilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBhZGQgcm93cyBkaXJlY3RseSBpZiBpdCdzIGFuIGFycmF5LCBvdGhlcndpc2UgYXNzaWduIHRoZW0gaW5cbiAgICAgICAgICByZXMocm93cy5sZW5ndGggPyB7IC4uLnJlc3BvbnNlT2JqLCBmaWVsZHMsIHJvd3MsIHNxbDogZmluYWxTcWwgfSA6IHsgLi4ucmVzcG9uc2VPYmosIGZpZWxkcywgLi4ucm93cywgc3FsOiBmaW5hbFNxbCB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBxdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcyA9IHt9KSB7XG4gICAgLy8gR2V0IGZ1bGwgcGF0aFxuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguam9pbihcbiAgICAgIHRoaXMuc3FsUGF0aCxcbiAgICAgIGZpbGVuYW1lICsgKHBhdGguZXh0bmFtZShmaWxlbmFtZSkgPT09ICcuc3FsJyA/ICcnIDogJy5zcWwnKVxuICAgICkpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAvLyBSZWFkIGZpbGUgYW5kIGV4ZWN1dGUgYXMgU1FMIHN0YXRlbWVudFxuICAgICAgZnMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGY4JywgKGVyciwgc3FsKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooJ0Nhbm5vdCBmaW5kOiAnICsgZXJyLnBhdGgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3FsID0gc3FsLnRyaW0oKVxuICAgICAgICAgIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzKS5jYXRjaChyZWopXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgSGVscGVyIEZ1bmN0aW9uc1xuICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogVHVybnMgYFNFTEVDVCAqIEZST00gdXNlciBXSEVSRSB1c2VyX2lkID0gOnVzZXJfaWRgLCBpbnRvXG4gICAqICAgICAgIGBTRUxFQ1QgKiBGUk9NIHVzZXIgV0hFUkUgdXNlcl9pZCA9IDFgXG4gICAqL1xuICBxdWVyeUZvcm1hdChxdWVyeSwgdmFsdWVzKSB7XG4gICAgaWYgKCF2YWx1ZXMpIHJldHVybiBxdWVyeVxuXG4gICAgcmV0dXJuIHF1ZXJ5LnJlcGxhY2UoL1xcOihcXHcrKS9nbSwgKHR4dCwga2V5KSA9PlxuICAgICAgdmFsdWVzLmhhc093blByb3BlcnR5KGtleSkgPyBteXNxbC5lc2NhcGUodmFsdWVzW2tleV0pIDogdHh0XG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIHt1c2VyX2lkOiAxLCBhZ2U6IDMwfSwgaW50b1xuICAgKiAgICAgICBcIldIRVJFIHVzZXJfaWQgPSAxIEFORCBhZ2UgPSAzMFwiXG4gICAqL1xuICBzcWxXaGVyZSh3aGVyZSkge1xuICAgIGlmICghd2hlcmUpIHJldHVyblxuICAgIGlmICh0eXBlb2Ygd2hlcmUgPT09ICdzdHJpbmcnKSByZXR1cm4gd2hlcmVcblxuICAgIGNvbnN0IHdoZXJlQXJyYXkgPSBbXVxuXG4gICAgZm9yIChsZXQga2V5IGluIHdoZXJlKSB7XG4gICAgICB3aGVyZUFycmF5LnB1c2goJ2AnICsga2V5ICsgJ2AgPSAnICsgbXlzcWwuZXNjYXBlKHdoZXJlW2tleV0pKVxuICAgIH1cblxuICAgIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIHtmaXJzdF9uYW1lOiAnQnJhZCcsIGxhc3RfbmFtZTogJ1dlc3RmYWxsJ30sIGludG9cbiAgICogICAgICAgYGZpcnN0X25hbWVgID0gJ0JyYWQnLCBgbGFzdF9uYW1lYCA9ICdXZXN0ZmFsbCdcbiAgICovXG4gIGNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpIHtcbiAgICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZXMgPSB0aGlzLnRyYW5zZm9ybVZhbHVlcyh2YWx1ZXMpXG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdHJhbnNmb3JtZWRWYWx1ZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdHJhbnNmb3JtZWRWYWx1ZXNba2V5XVxuICAgICAgdmFsdWVzQXJyYXkucHVzaChgXFxgJHtrZXl9XFxgID0gJHt2YWx1ZX1gKVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgdmFsdWVzIG9mIHRoZSBcInZhbHVlc1wiIGFyZ3VtZW50IG1hdGNoIHRoZSBrZXlzIG9mIHRoZSB0aGlzLnRyYW5zZm9ybXNcbiAgICogb2JqZWN0LCB0aGVuIHVzZSB0aGUgdHJhbnNmb3JtcyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBzdXBwbGllZCB2YWx1ZVxuICAgKi9cbiAgdHJhbnNmb3JtVmFsdWVzKHZhbHVlcykge1xuICAgIGNvbnN0IG5ld09iaiA9IHt9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICBjb25zdCByYXdWYWx1ZSA9IHZhbHVlc1trZXldXG4gICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLnRyYW5zZm9ybXNbcmF3VmFsdWVdXG4gICAgICBsZXQgdmFsdWVcblxuICAgICAgaWYgKHRoaXMudHJhbnNmb3Jtcy5oYXNPd25Qcm9wZXJ0eShyYXdWYWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSB0eXBlb2YgdHJhbnNmb3JtID09PSAnZnVuY3Rpb24nID8gdHJhbnNmb3JtKHJhd1ZhbHVlLCB2YWx1ZXMpIDogdHJhbnNmb3JtXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IG15c3FsLmVzY2FwZShyYXdWYWx1ZSlcbiAgICAgIH1cblxuICAgICAgbmV3T2JqW2tleV0gPSB2YWx1ZVxuICAgIH1cblxuICAgIHJldHVybiBuZXdPYmpcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IE15U3FsXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsSUFBTSxjQUFjO2NBQ04sQ0FBWjtnQkFDYyxDQUFkO1lBQ1UsQ0FBVjtlQUNhLENBQWI7UUFDTSxFQUFOO1VBQ1EsRUFBUjtDQU5JOztJQVNBO1dBQUEsS0FDSixHQUE4QztRQUFqQyxnRUFBVSxFQUFFLE1BQU0sV0FBTixrQkFBcUI7c0NBRDFDLE9BQzBDOztTQUN2QyxVQUFMLEdBQWtCLE1BQU0sZ0JBQU4sQ0FBdUIsT0FBdkIsQ0FBbEIsQ0FENEM7U0FFdkMsT0FBTCxHQUFlLFFBQVEsT0FBUixJQUFtQixPQUFuQixDQUY2QjtTQUd2QyxVQUFMLEdBQWtCLFFBQVEsVUFBUixJQUFzQixFQUF0QixDQUgwQjtHQUE5Qzs7Ozs7Ozs7OzJCQURJOzsyQkFZRyxLQUFrQjtVQUFiLCtEQUFTLGtCQUFJOzthQUNoQixLQUFLLEtBQUwsQ0FBVyxHQUFYLEVBQWdCLE1BQWhCLEVBQXdCLElBQXhCLENBQTZCO2VBQVUsT0FBTyxJQUFQO09BQVYsQ0FBcEMsQ0FEdUI7Ozs7Ozs7Ozs7OytCQVNkLFVBQXVCO1VBQWIsK0RBQVMsa0JBQUk7O2FBQ3pCLEtBQUssU0FBTCxDQUFlLFFBQWYsRUFBeUIsTUFBekIsRUFBaUMsSUFBakMsQ0FBc0M7ZUFBVSxPQUFPLElBQVA7T0FBVixDQUE3QyxDQURnQzs7Ozs7Ozs7OzJCQU8zQixPQUFvQjtVQUFiLCtEQUFTLGtC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