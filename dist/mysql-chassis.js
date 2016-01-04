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
    value: function select(sql, values) {
      var next = arguments.length <= 2 || arguments[2] === undefined ? values : arguments[2];

      if (typeof values === 'function') {
        values = {};
      }

      this.connection.query(sql, values, function (err, rows, fields) {
        return next(err, rows, fields);
      });
    }
  }, {
    key: 'selectFile',
    value: function selectFile(filename, values) {
      var next = arguments.length <= 2 || arguments[2] === undefined ? values : arguments[2];

      if (typeof values === 'function') {
        values = {};
      }

      var _this = this;

      // Get full path
      var filePath = path.resolve(path.join(this.sqlPath, filename + (path.extname(filename) === '.sql' ? '' : '.sql')));

      // Read file and execute as SQL statement
      fs.readFile(filePath, 'utf8', function (err, sql) {
        if (err) {
          next('Cannot find: ' + err.path);
        } else {
          sql = sql.replace(/\n*$/m, ' ').replace(/ $/, '');
          _this.select(sql, values, next);
        }
      });
    }
  }, {
    key: 'insert',
    value: function insert(table, values, next) {
      var sql = 'INSERT INTO `' + table + '` SET ' + getInsertValues(values);

      this.connection.query(sql, function (err, rows, fields) {
        if (err) {
          next(err);
        } else {
          next(null, rows.insertId);
        }
      });
    }
  }, {
    key: 'update',
    value: function update(table, values, where, next) {
      var sql = 'UPDATE `' + table + '` SET ' + getInsertValues(values) + ' ' + sqlWhere(where);

      this.connection.query(sql, function (err, rows, fields) {
        if (err) {
          next(err);
        } else {
          next(null, rows.affectedRows);
        }
      });
    }
  }]);
  return MySql;
})();

module.exports = MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5qcyIsInNvdXJjZXMiOlsiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuY29uc3QgZ2V0SW5zZXJ0VmFsdWVzID0gKHZhbHVlcykgPT4ge1xuICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG5cbiAgZm9yIChsZXQga2V5IGluIHZhbHVlcykge1xuICAgIHZhbHVlc0FycmF5LnB1c2goJ2AnICsga2V5ICsgJ2AgPSAnICsgbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSlcbiAgfVxuXG4gIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbn1cblxuY29uc3Qgc3FsV2hlcmUgPSAod2hlcmUpID0+IHtcbiAgaWYgKCF3aGVyZSkgcmV0dXJuXG5cbiAgY29uc3Qgd2hlcmVBcnJheSA9IFtdXG5cbiAgZm9yIChsZXQga2V5IGluIHdoZXJlKSB7XG4gICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh3aGVyZVtrZXldKSlcbiAgfVxuXG4gIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxufVxuXG5jbGFzcyBNeVNxbCB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zID0geyBob3N0OiAnbG9jYWxob3N0JyB9KSB7XG4gICAgdGhpcy5jb25uZWN0aW9uID0gbXlzcWwuY3JlYXRlQ29ubmVjdGlvbihvcHRpb25zKVxuICAgIHRoaXMuc3FsUGF0aCA9IG9wdGlvbnMuc3FsUGF0aCB8fCAnLi9zcWwnXG4gIH1cblxuICBzZWxlY3QgKHNxbCwgdmFsdWVzLCBuZXh0ID0gdmFsdWVzKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhbHVlcyA9IHt9XG4gICAgfVxuXG4gICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgdmFsdWVzLCAoZXJyLCByb3dzLCBmaWVsZHMpID0+IG5leHQoZXJyLCByb3dzLCBmaWVsZHMpKVxuICB9XG5cbiAgc2VsZWN0RmlsZSAoZmlsZW5hbWUsIHZhbHVlcywgbmV4dCA9IHZhbHVlcykge1xuICAgIGlmICh0eXBlb2YgdmFsdWVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YWx1ZXMgPSB7fVxuICAgIH1cblxuICAgIGNvbnN0IF90aGlzID0gdGhpc1xuXG4gICAgLy8gR2V0IGZ1bGwgcGF0aFxuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguam9pbihcbiAgICAgIHRoaXMuc3FsUGF0aCxcbiAgICAgIGZpbGVuYW1lICsgKHBhdGguZXh0bmFtZShmaWxlbmFtZSkgPT09ICcuc3FsJyA/ICcnIDogJy5zcWwnKVxuICAgICkpXG5cbiAgICAvLyBSZWFkIGZpbGUgYW5kIGV4ZWN1dGUgYXMgU1FMIHN0YXRlbWVudFxuICAgIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmOCcsIChlcnIsIHNxbCkgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBuZXh0KCdDYW5ub3QgZmluZDogJyArIGVyci5wYXRoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3FsID0gc3FsLnJlcGxhY2UoL1xcbiokL20sICcgJykucmVwbGFjZSgvICQvLCAnJylcbiAgICAgICAgX3RoaXMuc2VsZWN0KHNxbCwgdmFsdWVzLCBuZXh0KVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBpbnNlcnQgKHRhYmxlLCB2YWx1ZXMsIG5leHQpIHtcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7Z2V0SW5zZXJ0VmFsdWVzKHZhbHVlcyl9YFxuXG4gICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgKGVyciwgcm93cywgZmllbGRzKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIG5leHQoZXJyKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dChudWxsLCByb3dzLmluc2VydElkKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICB1cGRhdGUgKHRhYmxlLCB2YWx1ZXMsIHdoZXJlLCBuZXh0KSB7XG4gICAgY29uc3Qgc3FsID0gYFVQREFURSBcXGAke3RhYmxlfVxcYCBTRVQgJHtnZXRJbnNlcnRWYWx1ZXModmFsdWVzKX0gJHtzcWxXaGVyZSh3aGVyZSl9YFxuXG4gICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgKGVyciwgcm93cywgZmllbGRzKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIG5leHQoZXJyKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dChudWxsLCByb3dzLmFmZmVjdGVkUm93cylcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE15U3FsXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxJQUFNLGVBQWUsR0FBRyxTQUFsQixlQUFlLENBQUksTUFBTSxFQUFLO01BQzVCLFdBQVcsR0FBRyxFQUFFLENBQUE7O09BRWpCLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtlQUNYLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUNqRTs7U0FFTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUE7Q0FDMUIsQ0FBQTs7QUFFRCxJQUFNLFFBQVEsR0FBRyxTQUFYLFFBQVEsQ0FBSSxLQUFLLEVBQUs7TUFDdEIsQ0FBQyxLQUFLLEVBQUUsT0FBTTs7TUFFWixVQUFVLEdBQUcsRUFBRSxDQUFBOztPQUVoQixJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUU7Y0FDWCxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLE1BQU0s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