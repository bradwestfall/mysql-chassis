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
    key: 'select',
    value: function select(sql) {
      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var _this = this;

      return new Promise(function (res, rej) {
        _this.connection.query(sql, values, function (err, rows) {
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
            res(result);
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
            res(result);
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
            res(result);
          }
        });
      });
    }
  }]);
  return MySql;
})();

module.exports = MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5qcyIsInNvdXJjZXMiOlsiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuY29uc3QgZ2V0SW5zZXJ0VmFsdWVzID0gKHZhbHVlcykgPT4ge1xuICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG5cbiAgZm9yIChsZXQga2V5IGluIHZhbHVlcykge1xuICAgIHZhbHVlc0FycmF5LnB1c2goJ2AnICsga2V5ICsgJ2AgPSAnICsgbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSlcbiAgfVxuXG4gIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbn1cblxuY29uc3Qgc3FsV2hlcmUgPSAod2hlcmUpID0+IHtcbiAgaWYgKCF3aGVyZSkgcmV0dXJuXG5cbiAgY29uc3Qgd2hlcmVBcnJheSA9IFtdXG5cbiAgZm9yIChsZXQga2V5IGluIHdoZXJlKSB7XG4gICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh3aGVyZVtrZXldKSlcbiAgfVxuXG4gIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxufVxuXG5jb25zdCByZXNwb25zZU9iaiA9IHtcbiAgZmllbGRDb3VudDogMCxcbiAgYWZmZWN0ZWRSb3dzOiAwLFxuICBpbnNlcnRJZDogMCxcbiAgY2hhbmdlZFJvd3M6IDAsXG4gIHJvd3M6IFtdLFxuICBmaWVsZHM6IFtdXG59XG5cbmNsYXNzIE15U3FsIHtcbiAgY29uc3RydWN0b3IgKG9wdGlvbnMgPSB7IGhvc3Q6ICdsb2NhbGhvc3QnIH0pIHtcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBteXNxbC5jcmVhdGVDb25uZWN0aW9uKG9wdGlvbnMpXG4gICAgdGhpcy5zcWxQYXRoID0gb3B0aW9ucy5zcWxQYXRoIHx8ICcuL3NxbCdcbiAgfVxuXG4gIHNlbGVjdCAoc3FsLCB2YWx1ZXMgPSB7fSkge1xuICAgIGNvbnN0IF90aGlzID0gdGhpc1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgX3RoaXMuY29ubmVjdGlvbi5xdWVyeShzcWwsIHZhbHVlcywgKGVyciwgcm93cywgZmllbGRzID0gW10pID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYWRkIHJvd3MgZGlyZWN0bHkgaWYgaXQncyBhbiBhcnJheSwgb3RoZXJ3aXNlIGFzc2lnbiB0aGVtIGluXG4gICAgICAgICAgcmVzKHJvd3MubGVuZ3RoID8geyAuLi5yZXNwb25zZU9iaiwgZmllbGRzLCByb3dzIH0gOiB7IC4uLnJlc3BvbnNlT2JqLCBmaWVsZHMsIC4uLnJvd3MgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgc2VsZWN0RmlsZSAoZmlsZW5hbWUsIHZhbHVlcyA9IHt9KSB7XG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXG5cbiAgICAvLyBHZXQgZnVsbCBwYXRoXG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5qb2luKFxuICAgICAgdGhpcy5zcWxQYXRoLFxuICAgICAgZmlsZW5hbWUgKyAocGF0aC5leHRuYW1lKGZpbGVuYW1lKSA9PT0gJy5zcWwnID8gJycgOiAnLnNxbCcpXG4gICAgKSlcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIC8vIFJlYWQgZmlsZSBhbmQgZXhlY3V0ZSBhcyBTUUwgc3RhdGVtZW50XG4gICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnLCAoZXJyLCBzcWwpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaignQ2Fubm90IGZpbmQ6ICcgKyBlcnIucGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzcWwgPSBzcWwucmVwbGFjZSgvXFxuKiQvbSwgJyAnKS5yZXBsYWNlKC8gJC8sICcnKVxuICAgICAgICAgIF90aGlzLnNlbGVjdChzcWwsIHZhbHVlcykudGhlbihyZXMpLmNhdGNoKHJlailcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgaW5zZXJ0ICh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7Z2V0SW5zZXJ0VmFsdWVzKHZhbHVlcyl9YFxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgX3RoaXMuY29ubmVjdGlvbi5xdWVyeShzcWwsIChlcnIsIHJlc3VsdCwgZmllbGRzKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyhyZXN1bHQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHVwZGF0ZSAodGFibGUsIHZhbHVlcywgd2hlcmUpIHtcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgICBjb25zdCBzcWwgPSBgVVBEQVRFIFxcYCR7dGFibGV9XFxgIFNFVCAke2dldEluc2VydFZhbHVlcyh2YWx1ZXMpfSAke3NxbFdoZXJlKHdoZXJlKX1gXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICBfdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyhyZXN1bHQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIGRlbGV0ZSAodGFibGUsIHdoZXJlKSB7XG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXG4gICAgY29uc3Qgc3FsID0gYERFTEVURSBGUk9NIFxcYCR7dGFibGV9XFxgICR7c3FsV2hlcmUod2hlcmUpfWBcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIF90aGlzLmNvbm5lY3Rpb24ucXVlcnkoc3FsLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzKHJlc3VsdClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE15U3FsXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLElBQU0sZUFBZSxHQUFHLFNBQWxCLGVBQWUsQ0FBSSxNQUFNLEVBQUs7TUFDNUIsV0FBVyxHQUFHLEVBQUUsQ0FBQTs7T0FFakIsSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO2VBQ1gsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQ2pFOztTQUVNLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtDQUMxQixDQUFBOztBQUVELElBQU0sUUFBUSxHQUFHLFNBQVgsUUFBUSxDQUFJLEtBQUssRUFBSztNQUN0QixDQUFDLEtBQUssRUFBRSxPQUFNOztNQUVaLFVBQVUsR0FBRyxFQUFFLENBQUE7O09BRWhCLElBQUksR0FBRyxJQUFJLEtBQUssRUFBRTtjQUNYLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUMv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