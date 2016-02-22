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
  },
  limitResults: false
};

var MySql = function () {
  function MySql(options) {
    babelHelpers.classCallCheck(this, MySql);

    options = babelHelpers.extends({}, defaultConnectionOptions, options);
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
    key: 'limitResults',
    value: function limitResults(sql, rows) {
      if (rows.length !== 1 || !this.settings.limitResults) return rows;
      return sql.match(/^SELECT .+LIMIT 1$/g) ? rows[0] : rows;
    }
  }]);
  return MySql;
}();

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICBhZmZlY3RlZFJvd3M6IDAsXG4gIGluc2VydElkOiAwLFxuICBjaGFuZ2VkUm93czogMCxcbiAgcm93czogW10sXG4gIGZpZWxkczogW10sXG4gIGZpZWxkQ291bnQ6IDBcbn1cblxuY29uc3QgZGVmYXVsdENvbm5lY3Rpb25PcHRpb25zID0ge1xuICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgIHBhc3N3b3JkOiAnJyxcbiAgICBzcWxQYXRoOiAnLi9zcWwnLFxuICAgIHRyYW5zZm9ybXM6IHtcbiAgICAgIHVuZGVmaW5lZDogJ05VTEwnLFxuICAgICAgJyc6ICdOVUxMJyxcbiAgICAgICdOT1coKSc6ICdOT1coKScsXG4gICAgICAnQ1VSVElNRSgpJzogJ0NVUlRJTUUoKSdcbiAgICB9LFxuICAgIGxpbWl0UmVzdWx0czogZmFsc2Vcbn1cblxuY2xhc3MgTXlTcWwge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7Li4uZGVmYXVsdENvbm5lY3Rpb25PcHRpb25zLCAuLi5vcHRpb25zfVxuICAgIHRoaXMuY29ubmVjdGlvbiA9IG15c3FsLmNyZWF0ZUNvbm5lY3Rpb24ob3B0aW9ucylcbiAgICB0aGlzLnNldHRpbmdzID0ge31cbiAgICB0aGlzLnNldHRpbmdzLnNxbFBhdGggPSBvcHRpb25zLnNxbFBhdGhcbiAgICB0aGlzLnNldHRpbmdzLnRyYW5zZm9ybXMgPSBvcHRpb25zLnRyYW5zZm9ybXNcbiAgICB0aGlzLnNldHRpbmdzLmxpbWl0UmVzdWx0cyA9IG9wdGlvbnMubGltaXRSZXN1bHRzXG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3FsXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgc2VsZWN0KHNxbCwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwsIHZhbHVlcykudGhlbihyZXN1bHQgPT4gcmVzdWx0LnJvd3MpXG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudCBmcm9tIGEgZmlsZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlcyAtIGJpbmRpbmcgdmFsdWVzXG4gICAqL1xuICBzZWxlY3RGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5RmlsZShmaWxlbmFtZSwgdmFsdWVzKS50aGVuKHJlc3VsdCA9PiByZXN1bHQucm93cylcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIElOU0VSVCBzdGF0ZW1lbnRcbiAgICovXG4gIGluc2VydCh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYW4gVVBEQVRFIHN0YXRlbWVudFxuICAgKi9cbiAgdXBkYXRlKHRhYmxlLCB2YWx1ZXMsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYFVQREFURSBcXGAke3RhYmxlfVxcYCBTRVQgJHt0aGlzLmNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpfSAke3RoaXMuc3FsV2hlcmUod2hlcmUpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhIERFTEVURSBzdGF0ZW1lbnRcbiAgICovXG4gIGRlbGV0ZSh0YWJsZSwgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgREVMRVRFIEZST00gXFxgJHt0YWJsZX1cXGAgJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIFByZXBhcmUgYW5kIHJ1biBhIHF1ZXJ5IHdpdGggYm91bmQgdmFsdWVzLiBSZXR1cm4gYSBwcm9taXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzcWxcbiAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlcyAtIGJpbmRpbmcgdmFsdWVzXG4gICAqL1xuICBxdWVyeShzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdmFyIGZpbmFsU3FsID0gdGhpcy5xdWVyeUZvcm1hdChzcWwsIHZhbHVlcykudHJpbSgpXG4gICAgICB0aGlzLmNvbm5lY3Rpb24ucXVlcnkoZmluYWxTcWwsIChlcnIsIHJvd3MsIGZpZWxkcyA9IFtdKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooe2Vyciwgc3FsOiBmaW5hbFNxbH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcm93cyA9IHRoaXMubGltaXRSZXN1bHRzKGZpbmFsU3FsLCByb3dzKVxuICAgICAgICAgIHJlcyh7IC4uLnJlc3BvbnNlT2JqLCBmaWVsZHMsIHJvd3MsIHNxbDogZmluYWxTcWwgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgcXVlcnlGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuICAgIC8vIEdldCBmdWxsIHBhdGhcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmpvaW4oXG4gICAgICB0aGlzLnNldHRpbmdzLnNxbFBhdGgsXG4gICAgICBmaWxlbmFtZSArIChwYXRoLmV4dG5hbWUoZmlsZW5hbWUpID09PSAnLnNxbCcgPyAnJyA6ICcuc3FsJylcbiAgICApKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgLy8gUmVhZCBmaWxlIGFuZCBleGVjdXRlIGFzIFNRTCBzdGF0ZW1lbnRcbiAgICAgIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmOCcsIChlcnIsIHNxbCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKCdDYW5ub3QgZmluZDogJyArIGVyci5wYXRoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNxbCA9IHNxbC50cmltKClcbiAgICAgICAgICB0aGlzLnF1ZXJ5KHNxbCwgdmFsdWVzKS50aGVuKHJlcykuY2F0Y2gocmVqKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIEhlbHBlciBGdW5jdGlvbnNcbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIFR1cm5zIGBTRUxFQ1QgKiBGUk9NIHVzZXIgV0hFUkUgdXNlcl9pZCA9IDp1c2VyX2lkYCwgaW50b1xuICAgKiAgICAgICBgU0VMRUNUICogRlJPTSB1c2VyIFdIRVJFIHVzZXJfaWQgPSAxYFxuICAgKi9cbiAgcXVlcnlGb3JtYXQocXVlcnksIHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSByZXR1cm4gcXVlcnlcblxuICAgIHJldHVybiBxdWVyeS5yZXBsYWNlKC9cXDooXFx3KykvZ20sICh0eHQsIGtleSkgPT5cbiAgICAgIHZhbHVlcy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSA6IHR4dFxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJucyB7dXNlcl9pZDogMSwgYWdlOiAzMH0sIGludG9cbiAgICogICAgICAgXCJXSEVSRSB1c2VyX2lkID0gMSBBTkQgYWdlID0gMzBcIlxuICAgKi9cbiAgc3FsV2hlcmUod2hlcmUpIHtcbiAgICBpZiAoIXdoZXJlKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHdoZXJlID09PSAnc3RyaW5nJykgcmV0dXJuIHdoZXJlXG5cbiAgICBjb25zdCB3aGVyZUFycmF5ID0gW11cblxuICAgIGZvciAobGV0IGtleSBpbiB3aGVyZSkge1xuICAgICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh3aGVyZVtrZXldKSlcbiAgICB9XG5cbiAgICByZXR1cm4gJ1dIRVJFICcgKyB3aGVyZUFycmF5LmpvaW4oJyBBTkQgJylcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJucyB7Zmlyc3RfbmFtZTogJ0JyYWQnLCBsYXN0X25hbWU6ICdXZXN0ZmFsbCd9LCBpbnRvXG4gICAqICAgICAgIGBmaXJzdF9uYW1lYCA9ICdCcmFkJywgYGxhc3RfbmFtZWAgPSAnV2VzdGZhbGwnXG4gICAqL1xuICBjcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKSB7XG4gICAgY29uc3QgdmFsdWVzQXJyYXkgPSBbXVxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWVzID0gdGhpcy50cmFuc2Zvcm1WYWx1ZXModmFsdWVzKVxuXG4gICAgZm9yIChsZXQga2V5IGluIHRyYW5zZm9ybWVkVmFsdWVzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRyYW5zZm9ybWVkVmFsdWVzW2tleV1cbiAgICAgIHZhbHVlc0FycmF5LnB1c2goYFxcYCR7a2V5fVxcYCA9ICR7dmFsdWV9YClcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVzQXJyYXkuam9pbigpXG4gIH1cblxuICAvKipcbiAgICogSWYgdGhlIHZhbHVlcyBvZiB0aGUgXCJ2YWx1ZXNcIiBhcmd1bWVudCBtYXRjaCB0aGUga2V5cyBvZiB0aGUgdGhpcy50cmFuc2Zvcm1zXG4gICAqIG9iamVjdCwgdGhlbiB1c2UgdGhlIHRyYW5zZm9ybXMgdmFsdWUgaW5zdGVhZCBvZiB0aGUgc3VwcGxpZWQgdmFsdWVcbiAgICovXG4gIHRyYW5zZm9ybVZhbHVlcyh2YWx1ZXMpIHtcbiAgICBjb25zdCBuZXdPYmogPSB7fVxuXG4gICAgZm9yIChsZXQga2V5IGluIHZhbHVlcykge1xuICAgICAgY29uc3QgcmF3VmFsdWUgPSB2YWx1ZXNba2V5XVxuICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5zZXR0aW5ncy50cmFuc2Zvcm1zW3Jhd1ZhbHVlXVxuICAgICAgbGV0IHZhbHVlXG5cbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRyYW5zZm9ybXMuaGFzT3duUHJvcGVydHkocmF3VmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gdHlwZW9mIHRyYW5zZm9ybSA9PT0gJ2Z1bmN0aW9uJyA/IHRyYW5zZm9ybShyYXdWYWx1ZSwgdmFsdWVzKSA6IHRyYW5zZm9ybVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBteXNxbC5lc2NhcGUocmF3VmFsdWUpXG4gICAgICB9XG5cbiAgICAgIG5ld09ialtrZXldID0gdmFsdWVcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3T2JqXG4gIH1cblxuICBsaW1pdFJlc3VsdHMoc3FsLCByb3dzKSB7XG4gICAgaWYgKHJvd3MubGVuZ3RoICE9PSAxIHx8ICF0aGlzLnNldHRpbmdzLmxpbWl0UmVzdWx0cykgcmV0dXJuIHJvd3NcbiAgICByZXR1cm4gKHNxbC5tYXRjaCgvXlNFTEVDVCAuK0xJTUlUIDEkL2cpKSA/IHJvd3NbMF0gOiByb3dzXG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVNxbFxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxJQUFNLGNBQWM7Z0JBQ0osQ0FBZDtZQUNVLENBQVY7ZUFDYSxDQUFiO1FBQ00sRUFBTjtVQUNRLEVBQVI7Y0FDWSxDQUFaO0NBTkk7O0FBU04s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