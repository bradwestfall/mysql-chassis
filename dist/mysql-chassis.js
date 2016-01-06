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

var MySql = (function () {
  function MySql() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? { host: 'localhost' } : arguments[0];
    babelHelpers_classCallCheck(this, MySql);

    this.connection = mysql.createConnection(options);
    this.sqlPath = options.sqlPath || './sql';
  }

  babelHelpers_createClass(MySql, [{
    key: 'select',
    value: function select(sql) {
      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var _this = this;

      return new Promise(function (res, rej) {
        _this.connection.query(sql, values, function (err, rows, fields) {
          if (err) {
            rej(err);
          } else {
            res(rows, fields);
          }
        });
      });
    }
  }, {
    key: 'selectFile',
    value: function selectFile(filename) {
      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var _this = this;

      // Get full path
      var filePath = path.resolve(path.join(this.sqlPath, filename + (path.extname(filename) === '.sql' ? '' : '.sql')));

      return new Promise(function (res, rej) {
        // Read file and execute as SQL statement
        fs.readFile(filePath, 'utf8', function (err, sql) {
          if (err) {
            rej('Cannot find: ' + err.path);
          } else {
            sql = sql.replace(/\n*$/m, ' ').replace(/ $/, '');
            _this.select(sql, values).then(res).catch(rej);
          }
        });
      });
    }
  }, {
    key: 'insert',
    value: function insert(table) {
      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var _this = this;
      var sql = 'INSERT INTO `' + table + '` SET ' + getInsertValues(values);

      return new Promise(function (res, rej) {
        _this.connection.query(sql, function (err, result, fields) {
          if (err) {
            rej(err);
          } else {
            res(result.insertId);
          }
        });
      });
    }
  }, {
    key: 'update',
    value: function update(table, values, where) {
      var _this = this;
      var sql = 'UPDATE `' + table + '` SET ' + getInsertValues(values) + ' ' + sqlWhere(where);

      return new Promise(function (res, rej) {
        _this.connection.query(sql, function (err, result) {
          if (err) {
            rej(err);
          } else {
            res(result.affectedRows);
          }
        });
      });
    }
  }, {
    key: 'delete',
    value: function _delete(table, where) {
      var _this = this;
      var sql = 'DELETE FROM `' + table + '` ' + sqlWhere(where);

      return new Promise(function (res, rej) {
        _this.connection.query(sql, function (err, result) {
          if (err) {
            rej(err);
          } else {
            res(result.affectedRows);
          }
        });
      });
    }
  }]);
  return MySql;
})();

module.exports = MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5qcyIsInNvdXJjZXMiOlsiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuY29uc3QgZ2V0SW5zZXJ0VmFsdWVzID0gKHZhbHVlcykgPT4ge1xuICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG5cbiAgZm9yIChsZXQga2V5IGluIHZhbHVlcykge1xuICAgIHZhbHVlc0FycmF5LnB1c2goJ2AnICsga2V5ICsgJ2AgPSAnICsgbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSlcbiAgfVxuXG4gIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbn1cblxuY29uc3Qgc3FsV2hlcmUgPSAod2hlcmUpID0+IHtcbiAgaWYgKCF3aGVyZSkgcmV0dXJuXG5cbiAgY29uc3Qgd2hlcmVBcnJheSA9IFtdXG5cbiAgZm9yIChsZXQga2V5IGluIHdoZXJlKSB7XG4gICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh3aGVyZVtrZXldKSlcbiAgfVxuXG4gIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxufVxuXG5jbGFzcyBNeVNxbCB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zID0geyBob3N0OiAnbG9jYWxob3N0JyB9KSB7XG4gICAgdGhpcy5jb25uZWN0aW9uID0gbXlzcWwuY3JlYXRlQ29ubmVjdGlvbihvcHRpb25zKVxuICAgIHRoaXMuc3FsUGF0aCA9IG9wdGlvbnMuc3FsUGF0aCB8fCAnLi9zcWwnXG4gIH1cblxuICBzZWxlY3QgKHNxbCwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIF90aGlzLmNvbm5lY3Rpb24ucXVlcnkoc3FsLCB2YWx1ZXMsIChlcnIsIHJvd3MsIGZpZWxkcykgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKGVycilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXMocm93cywgZmllbGRzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBzZWxlY3RGaWxlIChmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcblxuICAgIC8vIEdldCBmdWxsIHBhdGhcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmpvaW4oXG4gICAgICB0aGlzLnNxbFBhdGgsXG4gICAgICBmaWxlbmFtZSArIChwYXRoLmV4dG5hbWUoZmlsZW5hbWUpID09PSAnLnNxbCcgPyAnJyA6ICcuc3FsJylcbiAgICApKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgLy8gUmVhZCBmaWxlIGFuZCBleGVjdXRlIGFzIFNRTCBzdGF0ZW1lbnRcbiAgICAgIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmOCcsIChlcnIsIHNxbCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKCdDYW5ub3QgZmluZDogJyArIGVyci5wYXRoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNxbCA9IHNxbC5yZXBsYWNlKC9cXG4qJC9tLCAnICcpLnJlcGxhY2UoLyAkLywgJycpXG4gICAgICAgICAgX3RoaXMuc2VsZWN0KHNxbCwgdmFsdWVzKS50aGVuKHJlcykuY2F0Y2gocmVqKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBpbnNlcnQgKHRhYmxlLCB2YWx1ZXMgPSB7fSkge1xuICAgIGNvbnN0IF90aGlzID0gdGhpc1xuICAgIGNvbnN0IHNxbCA9IGBJTlNFUlQgSU5UTyBcXGAke3RhYmxlfVxcYCBTRVQgJHtnZXRJbnNlcnRWYWx1ZXModmFsdWVzKX1gXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICBfdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgKGVyciwgcmVzdWx0LCBmaWVsZHMpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzKHJlc3VsdC5pbnNlcnRJZClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgdXBkYXRlICh0YWJsZSwgdmFsdWVzLCB3aGVyZSkge1xuICAgIGNvbnN0IF90aGlzID0gdGhpc1xuICAgIGNvbnN0IHNxbCA9IGBVUERBVEUgXFxgJHt0YWJsZX1cXGAgU0VUICR7Z2V0SW5zZXJ0VmFsdWVzKHZhbHVlcyl9ICR7c3FsV2hlcmUod2hlcmUpfWBcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIF90aGlzLmNvbm5lY3Rpb24ucXVlcnkoc3FsLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzKHJlc3VsdC5hZmZlY3RlZFJvd3MpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIGRlbGV0ZSAodGFibGUsIHdoZXJlKSB7XG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXG4gICAgY29uc3Qgc3FsID0gYERFTEVURSBGUk9NIFxcYCR7dGFibGV9XFxgICR7c3FsV2hlcmUod2hlcmUpfWBcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIF90aGlzLmNvbm5lY3Rpb24ucXVlcnkoc3FsLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzKHJlc3VsdC5hZmZlY3RlZFJvd3MpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVNxbFxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsSUFBTSxlQUFlLEdBQUcsU0FBbEIsZUFBZSxDQUFJLE1BQU0sRUFBSztNQUM1QixXQUFXLEdBQUcsRUFBRSxDQUFBOztPQUVqQixJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7ZUFDWCxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FDakU7O1NBRU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFBO0NBQzFCLENBQUE7O0FBRUQsSUFBTSxRQUFRLEdBQUcsU0FBWCxRQUFRLENBQUksS0FBSyxFQUFLO01BQ3RCLENBQUMsS0FBSyxFQUFFLE9BQU07O01BRVosVUFBVSxHQUFHLEVBQUUsQ0FBQTs7T0FFaEIsSUFBSSxHQUFHLElBQUksS0FBSyxFQUFFO2NBQ1gsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQy9EOztTQUVNLFFBQVEsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0NBQzNDLENBQUE7O0lBRUssS0FBSztXQUFMLEtBQUssR0FDcUM7UUFBakMsT0FBTyx5REFBRyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUU7c0NBRHhDLEtBQUs7O1FBRUgsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQzdDLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFBO0dBQzFD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