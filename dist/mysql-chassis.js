'use strict';

var mysql = require('mysql');
mysql = 'default' in mysql ? mysql['default'] : mysql;
var path = require('path');
path = 'default' in path ? path['default'] : path;
var fs = require('fs');
fs = 'default' in fs ? fs['default'] : fs;

var babelHelpers = {};

function babelHelpers_classCallCheck (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var babelHelpers_createClass = (function () {
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
})();

var babelHelpers_extends = Object.assign || function (target) {
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

var getInsertValues = function getInsertValues(values) {
  var valuesArray = [];

  for (var key in values) {
    valuesArray.push('`' + key + '` = ' + mysql.escape(values[key]));
  }

  return valuesArray.join();
};

var sqlWhere = function sqlWhere(where) {
  if (!where) return;

  var whereArray = [];

  for (var key in where) {
    whereArray.push('`' + key + '` = ' + mysql.escape(where[key]));
  }

  return 'WHERE ' + whereArray.join(' AND ');
};

var responseObj = {
  fieldCount: 0,
  affectedRows: 0,
  insertId: 0,
  changedRows: 0,
  rows: [],
  fields: []
};

var MySql = (function () {
  function MySql() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? { host: 'localhost' } : arguments[0];
    babelHelpers_classCallCheck(this, MySql);

    this.connection = mysql.createConnection(options);
    this.sqlPath = options.sqlPath || './sql';
  }

  babelHelpers_createClass(MySql, [{
    key: 'query',
    value: function query(sql) {
      var _connection;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      (_connection = this.connection).query.apply(_connection, [MySql.queryFormat(sql)].concat(args));
    }
  }, {
    key: 'select',
    value: function select(sql) {
      var _this = this;

      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return new Promise(function (res, rej) {
        _this.query(sql, values, function (err, rows) {
          var fields = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

          if (err) {
            rej(err);
          } else {
            // add rows directly if it's an array, otherwise assign them in
            res(rows.length ? babelHelpers_extends({}, responseObj, { fields: fields, rows: rows }) : babelHelpers_extends({}, responseObj, { fields: fields }, rows));
          }
        });
      });
    }
  }, {
    key: 'selectFile',
    value: function selectFile(filename) {
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
            sql = sql.replace(/\n*$/m, ' ').replace(/ $/, '');
            _this2.select(sql, values).then(res).catch(rej);
          }
        });
      });
    }
  }, {
    key: 'insert',
    value: function insert(table) {
      var _this3 = this;

      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var sql = 'INSERT INTO `' + table + '` SET ' + getInsertValues(values);

      return new Promise(function (res, rej) {
        _this3.query(sql, function (err, result, fields) {
          if (err) {
            rej(err);
          } else {
            res(result);
          }
        });
      });
    }
  }, {
    key: 'update',
    value: function update(table, values, where) {
      var _this4 = this;

      var sql = 'UPDATE `' + table + '` SET ' + getInsertValues(values) + ' ' + sqlWhere(where);

      return new Promise(function (res, rej) {
        _this4.query(sql, function (err, result) {
          if (err) {
            rej(err);
          } else {
            res(result);
          }
        });
      });
    }
  }, {
    key: 'delete',
    value: function _delete(table, where) {
      var _this5 = this;

      var sql = 'DELETE FROM `' + table + '` ' + sqlWhere(where);

      return new Promise(function (res, rej) {
        _this5.query(sql, function (err, result) {
          if (err) {
            rej(err);
          } else {
            res(result);
          }
        });
      });
    }
  }], [{
    key: 'queryFormat',
    value: function queryFormat(query, values) {
      if (!values) {
        return query;
      }

      return query.replace(/\:(\w+)/g, function (txt, key) {
        return values.hasOwnProperty(key) ? mysql.escape(values[key]) : txt;
      });
    }
  }]);
  return MySql;
})();

module.exports = MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5qcyIsInNvdXJjZXMiOlsiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuY29uc3QgZ2V0SW5zZXJ0VmFsdWVzID0gKHZhbHVlcykgPT4ge1xuICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG5cbiAgZm9yIChsZXQga2V5IGluIHZhbHVlcykge1xuICAgIHZhbHVlc0FycmF5LnB1c2goJ2AnICsga2V5ICsgJ2AgPSAnICsgbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSlcbiAgfVxuXG4gIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbn1cblxuY29uc3Qgc3FsV2hlcmUgPSAod2hlcmUpID0+IHtcbiAgaWYgKCF3aGVyZSkgcmV0dXJuXG5cbiAgY29uc3Qgd2hlcmVBcnJheSA9IFtdXG5cbiAgZm9yIChsZXQga2V5IGluIHdoZXJlKSB7XG4gICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh3aGVyZVtrZXldKSlcbiAgfVxuXG4gIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxufVxuXG5jb25zdCByZXNwb25zZU9iaiA9IHtcbiAgZmllbGRDb3VudDogMCxcbiAgYWZmZWN0ZWRSb3dzOiAwLFxuICBpbnNlcnRJZDogMCxcbiAgY2hhbmdlZFJvd3M6IDAsXG4gIHJvd3M6IFtdLFxuICBmaWVsZHM6IFtdXG59XG5cbmNsYXNzIE15U3FsIHtcbiAgY29uc3RydWN0b3IgKG9wdGlvbnMgPSB7IGhvc3Q6ICdsb2NhbGhvc3QnIH0pIHtcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBteXNxbC5jcmVhdGVDb25uZWN0aW9uKG9wdGlvbnMpXG4gICAgdGhpcy5zcWxQYXRoID0gb3B0aW9ucy5zcWxQYXRoIHx8ICcuL3NxbCdcbiAgfVxuXG4gIHN0YXRpYyBxdWVyeUZvcm1hdCAocXVlcnksIHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSB7XG4gICAgICByZXR1cm4gcXVlcnlcbiAgICB9XG5cbiAgICByZXR1cm4gcXVlcnkucmVwbGFjZSgvXFw6KFxcdyspL2csICh0eHQsIGtleSkgPT5cbiAgICAgIHZhbHVlcy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSA6IHR4dFxuICAgIClcbiAgfVxuXG4gIHF1ZXJ5IChzcWwsIC4uLmFyZ3MpIHtcbiAgICB0aGlzLmNvbm5lY3Rpb24ucXVlcnkoTXlTcWwucXVlcnlGb3JtYXQoc3FsKSwgLi4uYXJncylcbiAgfVxuXG4gIHNlbGVjdCAoc3FsLCB2YWx1ZXMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMsIChlcnIsIHJvd3MsIGZpZWxkcyA9IFtdKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGFkZCByb3dzIGRpcmVjdGx5IGlmIGl0J3MgYW4gYXJyYXksIG90aGVyd2lzZSBhc3NpZ24gdGhlbSBpblxuICAgICAgICAgIHJlcyhyb3dzLmxlbmd0aCA/IHsgLi4ucmVzcG9uc2VPYmosIGZpZWxkcywgcm93cyB9IDogeyAuLi5yZXNwb25zZU9iaiwgZmllbGRzLCAuLi5yb3dzIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHNlbGVjdEZpbGUgKGZpbGVuYW1lLCB2YWx1ZXMgPSB7fSkge1xuICAgIC8vIEdldCBmdWxsIHBhdGhcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmpvaW4oXG4gICAgICB0aGlzLnNxbFBhdGgsXG4gICAgICBmaWxlbmFtZSArIChwYXRoLmV4dG5hbWUoZmlsZW5hbWUpID09PSAnLnNxbCcgPyAnJyA6ICcuc3FsJylcbiAgICApKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgLy8gUmVhZCBmaWxlIGFuZCBleGVjdXRlIGFzIFNRTCBzdGF0ZW1lbnRcbiAgICAgIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmOCcsIChlcnIsIHNxbCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKCdDYW5ub3QgZmluZDogJyArIGVyci5wYXRoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNxbCA9IHNxbC5yZXBsYWNlKC9cXG4qJC9tLCAnICcpLnJlcGxhY2UoLyAkLywgJycpXG4gICAgICAgICAgdGhpcy5zZWxlY3Qoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzKS5jYXRjaChyZWopXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIGluc2VydCAodGFibGUsIHZhbHVlcyA9IHt9KSB7XG4gICAgY29uc3Qgc3FsID0gYElOU0VSVCBJTlRPIFxcYCR7dGFibGV9XFxgIFNFVCAke2dldEluc2VydFZhbHVlcyh2YWx1ZXMpfWBcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHRoaXMucXVlcnkoc3FsLCAoZXJyLCByZXN1bHQsIGZpZWxkcykgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKGVycilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXMocmVzdWx0KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICB1cGRhdGUgKHRhYmxlLCB2YWx1ZXMsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYFVQREFURSBcXGAke3RhYmxlfVxcYCBTRVQgJHtnZXRJbnNlcnRWYWx1ZXModmFsdWVzKX0gJHtzcWxXaGVyZSh3aGVyZSl9YFxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdGhpcy5xdWVyeShzcWwsIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKGVycilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXMocmVzdWx0KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBkZWxldGUgKHRhYmxlLCB3aGVyZSkge1xuICAgIGNvbnN0IHNxbCA9IGBERUxFVEUgRlJPTSBcXGAke3RhYmxlfVxcYCAke3NxbFdoZXJlKHdoZXJlKX1gXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICB0aGlzLnF1ZXJ5KHNxbCwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyhyZXN1bHQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVNxbFxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxJQUFNLGVBQWUsR0FBRyxTQUFsQixlQUFlLENBQUksTUFBTSxFQUFLO01BQzVCLFdBQVcsR0FBRyxFQUFFLENBQUE7O09BRWpCLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtlQUNYLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUNqRTs7U0FFTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUE7Q0FDMUIsQ0FBQTs7QUFFRCxJQUFNLFFBQVEsR0FBRyxTQUFYLFFBQVEsQ0FBSSxLQUFLLEVBQUs7TUFDdEIsQ0FBQyxLQUFLLEVBQUUsT0FBTTs7TUFFWixVQUFVLEdBQUcsRUFBRSxD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