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
  affectedRows: 0,
  insertId: 0,
  changedRows: 0,
  rows: [],
  fields: []
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
  },
  limitResults: false
};

var MySql = function () {
  function MySql(options) {
    babelHelpers.classCallCheck(this, MySql);

    options = Object.assign({}, defaultConnectionOptions, options);
    this.connection = mysql.createConnection(options);
    this.settings = {};
    this.settings.sqlPath = options.sqlPath;
    this.settings.transforms = options.transforms;
    this.settings.limitResults = options.limitResults;
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
        _this.connection.query(finalSql, function (err, rows) {
          var fields = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

          if (err) {
            rej({ err: err, sql: finalSql });
          } else {
            rows = _this.limitResults(finalSql, rows);
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

        if (this.transforms.hasOwnProperty(rawValue)) {
          value = typeof transform === 'function' ? transform(rawValue, values) : transform;
        } else {
          value = mysql.escape(rawValue);
        }

        newObj[key] = value;
      }

      return newObj;
    }
  }, {
    key: 'limitResults',
    value: function limitResults(sql, rows) {
      if (rows.length !== 1 || !this.settings.limitResults) return rows;
      return sql.match(/^SELECT .+LIMIT 1$/g) ? rows[0] : rows;
    }
  }]);
  return MySql;
}();

module.exports = MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5qcyIsInNvdXJjZXMiOlsiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gIGFmZmVjdGVkUm93czogMCxcbiAgaW5zZXJ0SWQ6IDAsXG4gIGNoYW5nZWRSb3dzOiAwLFxuICByb3dzOiBbXSxcbiAgZmllbGRzOiBbXVxufVxuXG5jb25zdCBkZWZhdWx0Q29ubmVjdGlvbk9wdGlvbnMgPSB7XG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgcGFzc3dvcmQ6ICcnLFxuICAgIHNxbFBhdGg6ICcuL3NxbCcsXG4gICAgdHJhbnNmb3Jtczoge1xuICAgICAgdW5kZWZpbmVkOiAnTlVMTCcsXG4gICAgICAnJzogJ05VTEwnLFxuICAgICAgJ05PVygpJzogJ05PVygpJyxcbiAgICAgICdDVVJUSU1FKCknOiAnQ1VSVElNRSgpJ1xuICAgIH0sXG4gICAgbGltaXRSZXN1bHRzOiBmYWxzZVxufVxuXG5jbGFzcyBNeVNxbCB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRDb25uZWN0aW9uT3B0aW9ucywgb3B0aW9ucylcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBteXNxbC5jcmVhdGVDb25uZWN0aW9uKG9wdGlvbnMpXG4gICAgdGhpcy5zZXR0aW5ncyA9IHt9XG4gICAgdGhpcy5zZXR0aW5ncy5zcWxQYXRoID0gb3B0aW9ucy5zcWxQYXRoXG4gICAgdGhpcy5zZXR0aW5ncy50cmFuc2Zvcm1zID0gb3B0aW9ucy50cmFuc2Zvcm1zXG4gICAgdGhpcy5zZXR0aW5ncy5saW1pdFJlc3VsdHMgPSBvcHRpb25zLmxpbWl0UmVzdWx0c1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNxbFxuICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWVzIC0gYmluZGluZyB2YWx1ZXNcbiAgICovXG4gIHNlbGVjdChzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC5yb3dzKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnQgZnJvbSBhIGZpbGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgc2VsZWN0RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcykudGhlbihyZXN1bHQgPT4gcmVzdWx0LnJvd3MpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhbiBJTlNFUlQgc3RhdGVtZW50XG4gICAqL1xuICBpbnNlcnQodGFibGUsIHZhbHVlcyA9IHt9KSB7XG4gICAgY29uc3Qgc3FsID0gYElOU0VSVCBJTlRPIFxcYCR7dGFibGV9XFxgIFNFVCAke3RoaXMuY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcyl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIFVQREFURSBzdGF0ZW1lbnRcbiAgICovXG4gIHVwZGF0ZSh0YWJsZSwgdmFsdWVzLCB3aGVyZSkge1xuICAgIGNvbnN0IHNxbCA9IGBVUERBVEUgXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX0gJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYSBERUxFVEUgc3RhdGVtZW50XG4gICAqL1xuICBkZWxldGUodGFibGUsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYERFTEVURSBGUk9NIFxcYCR7dGFibGV9XFxgICR7dGhpcy5zcWxXaGVyZSh3aGVyZSl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwYXJlIGFuZCBydW4gYSBxdWVyeSB3aXRoIGJvdW5kIHZhbHVlcy4gUmV0dXJuIGEgcHJvbWlzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3FsXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgcXVlcnkoc3FsLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHZhciBmaW5hbFNxbCA9IHRoaXMucXVlcnlGb3JtYXQoc3FsLCB2YWx1ZXMpLnRyaW0oKVxuICAgICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KGZpbmFsU3FsLCAoZXJyLCByb3dzLCBmaWVsZHMgPSBbXSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKHtlcnIsIHNxbDogZmluYWxTcWx9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJvd3MgPSB0aGlzLmxpbWl0UmVzdWx0cyhmaW5hbFNxbCwgcm93cylcbiAgICAgICAgICByZXMoeyAuLi5yZXNwb25zZU9iaiwgZmllbGRzLCByb3dzLCBzcWw6IGZpbmFsU3FsIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHF1ZXJ5RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICAvLyBHZXQgZnVsbCBwYXRoXG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5qb2luKFxuICAgICAgdGhpcy5zZXR0aW5ncy5zcWxQYXRoLFxuICAgICAgZmlsZW5hbWUgKyAocGF0aC5leHRuYW1lKGZpbGVuYW1lKSA9PT0gJy5zcWwnID8gJycgOiAnLnNxbCcpXG4gICAgKSlcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIC8vIFJlYWQgZmlsZSBhbmQgZXhlY3V0ZSBhcyBTUUwgc3RhdGVtZW50XG4gICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnLCAoZXJyLCBzcWwpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaignQ2Fubm90IGZpbmQ6ICcgKyBlcnIucGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzcWwgPSBzcWwudHJpbSgpXG4gICAgICAgICAgdGhpcy5xdWVyeShzcWwsIHZhbHVlcykudGhlbihyZXMpLmNhdGNoKHJlailcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICBIZWxwZXIgRnVuY3Rpb25zXG4gICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBUdXJucyBgU0VMRUNUICogRlJPTSB1c2VyIFdIRVJFIHVzZXJfaWQgPSA6dXNlcl9pZGAsIGludG9cbiAgICogICAgICAgYFNFTEVDVCAqIEZST00gdXNlciBXSEVSRSB1c2VyX2lkID0gMWBcbiAgICovXG4gIHF1ZXJ5Rm9ybWF0KHF1ZXJ5LCB2YWx1ZXMpIHtcbiAgICBpZiAoIXZhbHVlcykgcmV0dXJuIHF1ZXJ5XG5cbiAgICByZXR1cm4gcXVlcnkucmVwbGFjZSgvXFw6KFxcdyspL2dtLCAodHh0LCBrZXkpID0+XG4gICAgICB2YWx1ZXMuaGFzT3duUHJvcGVydHkoa2V5KSA/IG15c3FsLmVzY2FwZSh2YWx1ZXNba2V5XSkgOiB0eHRcbiAgICApXG4gIH1cblxuICAvKipcbiAgICogVHVybnMge3VzZXJfaWQ6IDEsIGFnZTogMzB9LCBpbnRvXG4gICAqICAgICAgIFwiV0hFUkUgdXNlcl9pZCA9IDEgQU5EIGFnZSA9IDMwXCJcbiAgICovXG4gIHNxbFdoZXJlKHdoZXJlKSB7XG4gICAgaWYgKCF3aGVyZSkgcmV0dXJuXG4gICAgaWYgKHR5cGVvZiB3aGVyZSA9PT0gJ3N0cmluZycpIHJldHVybiB3aGVyZVxuXG4gICAgY29uc3Qgd2hlcmVBcnJheSA9IFtdXG5cbiAgICBmb3IgKGxldCBrZXkgaW4gd2hlcmUpIHtcbiAgICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCA9ICcgKyBteXNxbC5lc2NhcGUod2hlcmVba2V5XSkpXG4gICAgfVxuXG4gICAgcmV0dXJuICdXSEVSRSAnICsgd2hlcmVBcnJheS5qb2luKCcgQU5EICcpXG4gIH1cblxuICAvKipcbiAgICogVHVybnMge2ZpcnN0X25hbWU6ICdCcmFkJywgbGFzdF9uYW1lOiAnV2VzdGZhbGwnfSwgaW50b1xuICAgKiAgICAgICBgZmlyc3RfbmFtZWAgPSAnQnJhZCcsIGBsYXN0X25hbWVgID0gJ1dlc3RmYWxsJ1xuICAgKi9cbiAgY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcykge1xuICAgIGNvbnN0IHZhbHVlc0FycmF5ID0gW11cbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlcyA9IHRoaXMudHJhbnNmb3JtVmFsdWVzKHZhbHVlcylcblxuICAgIGZvciAobGV0IGtleSBpbiB0cmFuc2Zvcm1lZFZhbHVlcykge1xuICAgICAgY29uc3QgdmFsdWUgPSB0cmFuc2Zvcm1lZFZhbHVlc1trZXldXG4gICAgICB2YWx1ZXNBcnJheS5wdXNoKGBcXGAke2tleX1cXGAgPSAke3ZhbHVlfWApXG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlc0FycmF5LmpvaW4oKVxuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSB2YWx1ZXMgb2YgdGhlIFwidmFsdWVzXCIgYXJndW1lbnQgbWF0Y2ggdGhlIGtleXMgb2YgdGhlIHRoaXMudHJhbnNmb3Jtc1xuICAgKiBvYmplY3QsIHRoZW4gdXNlIHRoZSB0cmFuc2Zvcm1zIHZhbHVlIGluc3RlYWQgb2YgdGhlIHN1cHBsaWVkIHZhbHVlXG4gICAqL1xuICB0cmFuc2Zvcm1WYWx1ZXModmFsdWVzKSB7XG4gICAgY29uc3QgbmV3T2JqID0ge31cblxuICAgIGZvciAobGV0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gdmFsdWVzW2tleV1cbiAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuc2V0dGluZ3MudHJhbnNmb3Jtc1tyYXdWYWx1ZV1cbiAgICAgIGxldCB2YWx1ZVxuXG4gICAgICBpZiAodGhpcy50cmFuc2Zvcm1zLmhhc093blByb3BlcnR5KHJhd1ZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IHR5cGVvZiB0cmFuc2Zvcm0gPT09ICdmdW5jdGlvbicgPyB0cmFuc2Zvcm0ocmF3VmFsdWUsIHZhbHVlcykgOiB0cmFuc2Zvcm1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gbXlzcWwuZXNjYXBlKHJhd1ZhbHVlKVxuICAgICAgfVxuXG4gICAgICBuZXdPYmpba2V5XSA9IHZhbHVlXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld09ialxuICB9XG5cbiAgbGltaXRSZXN1bHRzKHNxbCwgcm93cykge1xuICAgIGlmIChyb3dzLmxlbmd0aCAhPT0gMSB8fCAhdGhpcy5zZXR0aW5ncy5saW1pdFJlc3VsdHMpIHJldHVybiByb3dzXG4gICAgcmV0dXJuIChzcWwubWF0Y2goL15TRUxFQ1QgLitMSU1JVCAxJC9nKSkgPyByb3dzWzBdIDogcm93c1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlTcWxcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxJQUFNLGNBQWM7Z0JBQ0osQ0FBZDtZQUNVLENBQVY7ZUFDYSxDQUFiO1FBQ00sRUFBTjtVQUNRLEVBQVI7Q0FMSTs7QUFRTixJQUFNLDJCQUEyQjtRQUN2QixXQUFOO1lBQ1Us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