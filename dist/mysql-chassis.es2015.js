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
      var _this = this;

      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.query(sql, values).then(function (result) {
        return _this.limitResults(sql, result.rows);
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
      var _this2 = this;

      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.queryFile(filename, values).then(function (result) {
        return _this2.limitResults(sql, result.rows);
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
      var _this3 = this;

      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return new Promise(function (res, rej) {
        var finalSql = _this3.queryFormat(sql, values).trim();
        _this3.connection.query(finalSql, function (err, rows) {
          var fields = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

          if (err) {
            rej({ err: err, sql: finalSql });
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
      var _this4 = this;

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
            _this4.query(sql, values).then(res).catch(rej);
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
  }, {
    key: 'limitResults',
    value: function limitResults(sql, rows) {
      if (!rows.length) return rows;
      var limit = 'LIMIT 1';
      return sql.substr(limit.length * -1).toUpperCase() === limit ? rows[0] : rows;
    }
  }]);
  return MySql;
}();

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICBmaWVsZENvdW50OiAwLFxuICBhZmZlY3RlZFJvd3M6IDAsXG4gIGluc2VydElkOiAwLFxuICBjaGFuZ2VkUm93czogMCxcbiAgcm93czogW10sXG4gIGZpZWxkczogW11cbn1cblxuY2xhc3MgTXlTcWwge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucyA9IHsgaG9zdDogJ2xvY2FsaG9zdCcgfSkge1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IG15c3FsLmNyZWF0ZUNvbm5lY3Rpb24ob3B0aW9ucylcbiAgICB0aGlzLnNxbFBhdGggPSBvcHRpb25zLnNxbFBhdGggfHwgJy4vc3FsJ1xuICAgIHRoaXMudHJhbnNmb3JtcyA9IG9wdGlvbnMudHJhbnNmb3JtcyB8fCB7fVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNxbFxuICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWVzIC0gYmluZGluZyB2YWx1ZXNcbiAgICovXG4gIHNlbGVjdChzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzdWx0ID0+IHRoaXMubGltaXRSZXN1bHRzKHNxbCwgcmVzdWx0LnJvd3MpKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnQgZnJvbSBhIGZpbGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgc2VsZWN0RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcykudGhlbihyZXN1bHQgPT4gdGhpcy5saW1pdFJlc3VsdHMoc3FsLCByZXN1bHQucm93cykpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhbiBJTlNFUlQgc3RhdGVtZW50XG4gICAqL1xuICBpbnNlcnQodGFibGUsIHZhbHVlcyA9IHt9KSB7XG4gICAgY29uc3Qgc3FsID0gYElOU0VSVCBJTlRPIFxcYCR7dGFibGV9XFxgIFNFVCAke3RoaXMuY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcyl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIFVQREFURSBzdGF0ZW1lbnRcbiAgICovXG4gIHVwZGF0ZSh0YWJsZSwgdmFsdWVzLCB3aGVyZSkge1xuICAgIGNvbnN0IHNxbCA9IGBVUERBVEUgXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX0gJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYSBERUxFVEUgc3RhdGVtZW50XG4gICAqL1xuICBkZWxldGUodGFibGUsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYERFTEVURSBGUk9NIFxcYCR7dGFibGV9XFxgICR7dGhpcy5zcWxXaGVyZSh3aGVyZSl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwYXJlIGFuZCBydW4gYSBxdWVyeSB3aXRoIGJvdW5kIHZhbHVlcy4gUmV0dXJuIGEgcHJvbWlzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3FsXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgcXVlcnkoc3FsLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHZhciBmaW5hbFNxbCA9IHRoaXMucXVlcnlGb3JtYXQoc3FsLCB2YWx1ZXMpLnRyaW0oKVxuICAgICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KGZpbmFsU3FsLCAoZXJyLCByb3dzLCBmaWVsZHMgPSBbXSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKHtlcnIsIHNxbDogZmluYWxTcWx9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGFkZCByb3dzIGRpcmVjdGx5IGlmIGl0J3MgYW4gYXJyYXksIG90aGVyd2lzZSBhc3NpZ24gdGhlbSBpblxuICAgICAgICAgIHJlcyhyb3dzLmxlbmd0aCA/IHsgLi4ucmVzcG9uc2VPYmosIGZpZWxkcywgcm93cywgc3FsOiBmaW5hbFNxbCB9IDogeyAuLi5yZXNwb25zZU9iaiwgZmllbGRzLCAuLi5yb3dzLCBzcWw6IGZpbmFsU3FsIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHF1ZXJ5RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICAvLyBHZXQgZnVsbCBwYXRoXG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5qb2luKFxuICAgICAgdGhpcy5zcWxQYXRoLFxuICAgICAgZmlsZW5hbWUgKyAocGF0aC5leHRuYW1lKGZpbGVuYW1lKSA9PT0gJy5zcWwnID8gJycgOiAnLnNxbCcpXG4gICAgKSlcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIC8vIFJlYWQgZmlsZSBhbmQgZXhlY3V0ZSBhcyBTUUwgc3RhdGVtZW50XG4gICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnLCAoZXJyLCBzcWwpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaignQ2Fubm90IGZpbmQ6ICcgKyBlcnIucGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzcWwgPSBzcWwudHJpbSgpXG4gICAgICAgICAgdGhpcy5xdWVyeShzcWwsIHZhbHVlcykudGhlbihyZXMpLmNhdGNoKHJlailcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICBIZWxwZXIgRnVuY3Rpb25zXG4gICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBUdXJucyBgU0VMRUNUICogRlJPTSB1c2VyIFdIRVJFIHVzZXJfaWQgPSA6dXNlcl9pZGAsIGludG9cbiAgICogICAgICAgYFNFTEVDVCAqIEZST00gdXNlciBXSEVSRSB1c2VyX2lkID0gMWBcbiAgICovXG4gIHF1ZXJ5Rm9ybWF0KHF1ZXJ5LCB2YWx1ZXMpIHtcbiAgICBpZiAoIXZhbHVlcykgcmV0dXJuIHF1ZXJ5XG5cbiAgICByZXR1cm4gcXVlcnkucmVwbGFjZSgvXFw6KFxcdyspL2dtLCAodHh0LCBrZXkpID0+XG4gICAgICB2YWx1ZXMuaGFzT3duUHJvcGVydHkoa2V5KSA/IG15c3FsLmVzY2FwZSh2YWx1ZXNba2V5XSkgOiB0eHRcbiAgICApXG4gIH1cblxuICAvKipcbiAgICogVHVybnMge3VzZXJfaWQ6IDEsIGFnZTogMzB9LCBpbnRvXG4gICAqICAgICAgIFwiV0hFUkUgdXNlcl9pZCA9IDEgQU5EIGFnZSA9IDMwXCJcbiAgICovXG4gIHNxbFdoZXJlKHdoZXJlKSB7XG4gICAgaWYgKCF3aGVyZSkgcmV0dXJuXG4gICAgaWYgKHR5cGVvZiB3aGVyZSA9PT0gJ3N0cmluZycpIHJldHVybiB3aGVyZVxuXG4gICAgY29uc3Qgd2hlcmVBcnJheSA9IFtdXG5cbiAgICBmb3IgKGxldCBrZXkgaW4gd2hlcmUpIHtcbiAgICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCA9ICcgKyBteXNxbC5lc2NhcGUod2hlcmVba2V5XSkpXG4gICAgfVxuXG4gICAgcmV0dXJuICdXSEVSRSAnICsgd2hlcmVBcnJheS5qb2luKCcgQU5EICcpXG4gIH1cblxuICAvKipcbiAgICogVHVybnMge2ZpcnN0X25hbWU6ICdCcmFkJywgbGFzdF9uYW1lOiAnV2VzdGZhbGwnfSwgaW50b1xuICAgKiAgICAgICBgZmlyc3RfbmFtZWAgPSAnQnJhZCcsIGBsYXN0X25hbWVgID0gJ1dlc3RmYWxsJ1xuICAgKi9cbiAgY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcykge1xuICAgIGNvbnN0IHZhbHVlc0FycmF5ID0gW11cbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlcyA9IHRoaXMudHJhbnNmb3JtVmFsdWVzKHZhbHVlcylcblxuICAgIGZvciAobGV0IGtleSBpbiB0cmFuc2Zvcm1lZFZhbHVlcykge1xuICAgICAgY29uc3QgdmFsdWUgPSB0cmFuc2Zvcm1lZFZhbHVlc1trZXldXG4gICAgICB2YWx1ZXNBcnJheS5wdXNoKGBcXGAke2tleX1cXGAgPSAke3ZhbHVlfWApXG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlc0FycmF5LmpvaW4oKVxuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSB2YWx1ZXMgb2YgdGhlIFwidmFsdWVzXCIgYXJndW1lbnQgbWF0Y2ggdGhlIGtleXMgb2YgdGhlIHRoaXMudHJhbnNmb3Jtc1xuICAgKiBvYmplY3QsIHRoZW4gdXNlIHRoZSB0cmFuc2Zvcm1zIHZhbHVlIGluc3RlYWQgb2YgdGhlIHN1cHBsaWVkIHZhbHVlXG4gICAqL1xuICB0cmFuc2Zvcm1WYWx1ZXModmFsdWVzKSB7XG4gICAgY29uc3QgbmV3T2JqID0ge31cblxuICAgIGZvciAobGV0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gdmFsdWVzW2tleV1cbiAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMudHJhbnNmb3Jtc1tyYXdWYWx1ZV1cbiAgICAgIGxldCB2YWx1ZVxuXG4gICAgICBpZiAodGhpcy50cmFuc2Zvcm1zLmhhc093blByb3BlcnR5KHJhd1ZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IHR5cGVvZiB0cmFuc2Zvcm0gPT09ICdmdW5jdGlvbicgPyB0cmFuc2Zvcm0ocmF3VmFsdWUsIHZhbHVlcykgOiB0cmFuc2Zvcm1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gbXlzcWwuZXNjYXBlKHJhd1ZhbHVlKVxuICAgICAgfVxuXG4gICAgICBuZXdPYmpba2V5XSA9IHZhbHVlXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld09ialxuICB9XG5cbiAgbGltaXRSZXN1bHRzKHNxbCwgcm93cykge1xuICAgIGlmICghcm93cy5sZW5ndGgpIHJldHVybiByb3dzXG4gICAgbGV0IGxpbWl0ID0gJ0xJTUlUIDEnXG4gICAgcmV0dXJuIHNxbC5zdWJzdHIobGltaXQubGVuZ3RoICogLTEpLnRvVXBwZXJDYXNlKCkgPT09IGxpbWl0ID8gcm93c1swXSA6IHJvd3NcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IE15U3FsXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLElBQU0sY0FBYztjQUNOLENBQVo7Z0JBQ2MsQ0FBZDtZQUNVLENBQVY7ZUFDYSxDQUFiO1FBQ00sRUFBTjtVQUNRLEVBQVI7Q0FOSTs7SUFTQTtXQUFBLEtBQ0osR0FBOEM7UUFBakMsZ0VBQVUsRUFBRSxNQUFNLFdBQU4sa0JBQXFCO3NDQUQxQyxPQUMwQzs7U0FDdkMsVUFBTCxHQUFrQixNQUFNLGdCQUFOLENBQXVCLE9BQXZCLENBQWxCLENBRDRDO1NBRXZDLE9BQUwsR0FBZSxRQUFRLE9BQVIsSUFBbUIsT0FBbkIsQ0FGNkI7U0FHdkMsVUFBTCxHQUFrQixRQUFRLFVBQVIsSUFBc0IsRUFBdEIsQ0FIMEI7R0FBOUM7Ozs7Ozs7OzsyQkFESTs7MkJBWUcsS0FBa0I7OztVQUFiLCtEQUFTLGtC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