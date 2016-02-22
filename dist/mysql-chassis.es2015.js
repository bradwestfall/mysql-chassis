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

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICBmaWVsZENvdW50OiAwLFxuICBhZmZlY3RlZFJvd3M6IDAsXG4gIGluc2VydElkOiAwLFxuICBjaGFuZ2VkUm93czogMCxcbiAgcm93czogW10sXG4gIGZpZWxkczogW11cbn1cblxuY2xhc3MgTXlTcWwge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucyA9IHsgaG9zdDogJ2xvY2FsaG9zdCcgfSkge1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IG15c3FsLmNyZWF0ZUNvbm5lY3Rpb24ob3B0aW9ucylcbiAgICB0aGlzLnNxbFBhdGggPSBvcHRpb25zLnNxbFBhdGggfHwgJy4vc3FsJ1xuICAgIHRoaXMudHJhbnNmb3JtcyA9IG9wdGlvbnMudHJhbnNmb3JtcyB8fCB7fVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNxbFxuICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWVzIC0gYmluZGluZyB2YWx1ZXNcbiAgICovXG4gIHNlbGVjdChzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC5yb3dzKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnQgZnJvbSBhIGZpbGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgc2VsZWN0RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcykudGhlbihyZXN1bHQgPT4gcmVzdWx0LnJvd3MpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhbiBJTlNFUlQgc3RhdGVtZW50XG4gICAqL1xuICBpbnNlcnQodGFibGUsIHZhbHVlcyA9IHt9KSB7XG4gICAgY29uc3Qgc3FsID0gYElOU0VSVCBJTlRPIFxcYCR7dGFibGV9XFxgIFNFVCAke3RoaXMuY3JlYXRlSW5zZXJ0VmFsdWVzKHZhbHVlcyl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIFVQREFURSBzdGF0ZW1lbnRcbiAgICovXG4gIHVwZGF0ZSh0YWJsZSwgdmFsdWVzLCB3aGVyZSkge1xuICAgIGNvbnN0IHNxbCA9IGBVUERBVEUgXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX0gJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYSBERUxFVEUgc3RhdGVtZW50XG4gICAqL1xuICBkZWxldGUodGFibGUsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYERFTEVURSBGUk9NIFxcYCR7dGFibGV9XFxgICR7dGhpcy5zcWxXaGVyZSh3aGVyZSl9YFxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KHNxbClcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwYXJlIGFuZCBydW4gYSBxdWVyeSB3aXRoIGJvdW5kIHZhbHVlcy4gUmV0dXJuIGEgcHJvbWlzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3FsXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZXMgLSBiaW5kaW5nIHZhbHVlc1xuICAgKi9cbiAgcXVlcnkoc3FsLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHZhciBmaW5hbFNxbCA9IHRoaXMucXVlcnlGb3JtYXQoc3FsLCB2YWx1ZXMpLnRyaW0oKVxuICAgICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgKGVyciwgcm93cywgZmllbGRzID0gW10pID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYWRkIHJvd3MgZGlyZWN0bHkgaWYgaXQncyBhbiBhcnJheSwgb3RoZXJ3aXNlIGFzc2lnbiB0aGVtIGluXG4gICAgICAgICAgcmVzKHJvd3MubGVuZ3RoID8geyAuLi5yZXNwb25zZU9iaiwgZmllbGRzLCByb3dzLCBzcWw6IGZpbmFsU3FsIH0gOiB7IC4uLnJlc3BvbnNlT2JqLCBmaWVsZHMsIC4uLnJvd3MsIHNxbDogZmluYWxTcWwgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgcXVlcnlGaWxlKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuICAgIC8vIEdldCBmdWxsIHBhdGhcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmpvaW4oXG4gICAgICB0aGlzLnNxbFBhdGgsXG4gICAgICBmaWxlbmFtZSArIChwYXRoLmV4dG5hbWUoZmlsZW5hbWUpID09PSAnLnNxbCcgPyAnJyA6ICcuc3FsJylcbiAgICApKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgLy8gUmVhZCBmaWxlIGFuZCBleGVjdXRlIGFzIFNRTCBzdGF0ZW1lbnRcbiAgICAgIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmOCcsIChlcnIsIHNxbCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKCdDYW5ub3QgZmluZDogJyArIGVyci5wYXRoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNxbCA9IHNxbC50cmltKClcbiAgICAgICAgICB0aGlzLnF1ZXJ5KHNxbCwgdmFsdWVzKS50aGVuKHJlcykuY2F0Y2gocmVqKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIEhlbHBlciBGdW5jdGlvbnNcbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIFR1cm5zIGBTRUxFQ1QgKiBGUk9NIHVzZXIgV0hFUkUgdXNlcl9pZCA9IDp1c2VyX2lkYCwgaW50b1xuICAgKiAgICAgICBgU0VMRUNUICogRlJPTSB1c2VyIFdIRVJFIHVzZXJfaWQgPSAxYFxuICAgKi9cbiAgcXVlcnlGb3JtYXQocXVlcnksIHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSByZXR1cm4gcXVlcnlcblxuICAgIHJldHVybiBxdWVyeS5yZXBsYWNlKC9cXDooXFx3KykvZ20sICh0eHQsIGtleSkgPT5cbiAgICAgIHZhbHVlcy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSA6IHR4dFxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJucyB7dXNlcl9pZDogMSwgYWdlOiAzMH0sIGludG9cbiAgICogICAgICAgXCJXSEVSRSB1c2VyX2lkID0gMSBBTkQgYWdlID0gMzBcIlxuICAgKi9cbiAgc3FsV2hlcmUod2hlcmUpIHtcbiAgICBpZiAoIXdoZXJlKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHdoZXJlID09PSAnc3RyaW5nJykgcmV0dXJuIHdoZXJlXG5cbiAgICBjb25zdCB3aGVyZUFycmF5ID0gW11cblxuICAgIGZvciAobGV0IGtleSBpbiB3aGVyZSkge1xuICAgICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh3aGVyZVtrZXldKSlcbiAgICB9XG5cbiAgICByZXR1cm4gJ1dIRVJFICcgKyB3aGVyZUFycmF5LmpvaW4oJyBBTkQgJylcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJucyB7Zmlyc3RfbmFtZTogJ0JyYWQnLCBsYXN0X25hbWU6ICdXZXN0ZmFsbCd9LCBpbnRvXG4gICAqICAgICAgIGBmaXJzdF9uYW1lYCA9ICdCcmFkJywgYGxhc3RfbmFtZWAgPSAnV2VzdGZhbGwnXG4gICAqL1xuICBjcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKSB7XG4gICAgY29uc3QgdmFsdWVzQXJyYXkgPSBbXVxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWVzID0gdGhpcy50cmFuc2Zvcm1WYWx1ZXModmFsdWVzKVxuXG4gICAgZm9yIChsZXQga2V5IGluIHRyYW5zZm9ybWVkVmFsdWVzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRyYW5zZm9ybWVkVmFsdWVzW2tleV1cbiAgICAgIHZhbHVlc0FycmF5LnB1c2goYFxcYCR7a2V5fVxcYCA9ICR7dmFsdWV9YClcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVzQXJyYXkuam9pbigpXG4gIH1cblxuICAvKipcbiAgICogSWYgdGhlIHZhbHVlcyBvZiB0aGUgXCJ2YWx1ZXNcIiBhcmd1bWVudCBtYXRjaCB0aGUga2V5cyBvZiB0aGUgdGhpcy50cmFuc2Zvcm1zXG4gICAqIG9iamVjdCwgdGhlbiB1c2UgdGhlIHRyYW5zZm9ybXMgdmFsdWUgaW5zdGVhZCBvZiB0aGUgc3VwcGxpZWQgdmFsdWVcbiAgICovXG4gIHRyYW5zZm9ybVZhbHVlcyh2YWx1ZXMpIHtcbiAgICBjb25zdCBuZXdPYmogPSB7fVxuXG4gICAgZm9yIChsZXQga2V5IGluIHZhbHVlcykge1xuICAgICAgY29uc3QgcmF3VmFsdWUgPSB2YWx1ZXNba2V5XVxuICAgICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy50cmFuc2Zvcm1zW3Jhd1ZhbHVlXVxuICAgICAgbGV0IHZhbHVlXG5cbiAgICAgIGlmICh0aGlzLnRyYW5zZm9ybXMuaGFzT3duUHJvcGVydHkocmF3VmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gdHlwZW9mIHRyYW5zZm9ybSA9PT0gJ2Z1bmN0aW9uJyA/IHRyYW5zZm9ybShyYXdWYWx1ZSwgdmFsdWVzKSA6IHRyYW5zZm9ybVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBteXNxbC5lc2NhcGUocmF3VmFsdWUpXG4gICAgICB9XG5cbiAgICAgIG5ld09ialtrZXldID0gdmFsdWVcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3T2JqXG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVNxbFxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxJQUFNLGNBQWM7Y0FDTixDQUFaO2dCQUNjLENBQWQ7WUFDVSxDQUFWO2VBQ2EsQ0FBYjtRQUNNLEVBQU47VUFDUSxFQUFSO0NBTkk7O0lBU0E7V0FBQSxLQUNKLEdBQThDO1FBQWpDLGdFQUFVLEVBQUUsTUFBTSxXQUFOLGtCQUFxQjtzQ0FEMUMsT0FDMEM7O1NBQ3ZDLFVBQUwsR0FBa0IsTUFBTSxnQkFBTixDQUF1QixPQUF2QixDQUFsQixDQUQ0QztTQUV2QyxPQUFMLEdBQWUsUUFBUSxPQUFSLElBQW1CLE9BQW5CLENBRjZCO1NBR3ZDLFVBQUwsR0FBa0IsUUFBUSxVQUFSLElBQXNCLEVBQXRCLENBSDBCO0dBQTlDOzs7Ozs7Ozs7MkJBREk7OzJCQVlHLEtBQWtCO1VBQWIsK0RBQVMsa0JBQUk7O2FBQ2hCLEtBQUssS0FBTCxDQUFXLEdBQVgsRUFBZ0IsTUFBaEIsRUFBd0IsSUFBeEIsQ0FBNkI7ZUFBVSxPQUFPLElBQVA7T0FBVixDQUFwQyxDQUR1Qjs7Ozs7Ozs7Ozs7K0JBU2QsVUFBdUI7VUFBYiwrREFBUyxrQkFBSTs7YUFDekIsS0FBSyxTQUFMLENBQWUsUUFBZixFQUF5QixNQUF6QixFQUFpQyxJQUFqQyxDQUFzQztlQUFVLE9BQU8sSUFBUDtPQUFWLENBQTdDLENBRGdDOzs7Ozs7Ozs7MkJBTzNCLE9BQW9CO1VBQWIsK0RBQVMs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