import mysql from 'mysql';
import path from 'path';
import fs from 'fs';

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
      var _this2 = this;

      var values = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var sql = 'INSERT INTO `' + table + '` SET ' + getInsertValues(values);

      return new Promise(function (res, rej) {
        _this2.connection.query(sql, function (err, rows, fields) {
          if (err) {
            rej(err);
          } else {
            res(rows.insertId);
          }
        });
      });
    }
  }, {
    key: 'update',
    value: function update(table, values, where, next) {
      var _this3 = this;

      var sql = 'UPDATE `' + table + '` SET ' + getInsertValues(values) + ' ' + sqlWhere(where);

      return new Promise(function (res, rej) {
        _this3.connection.query(sql, function (err, rows, fields) {
          if (err) {
            rej(err);
          } else {
            res(rows.affectedRows);
          }
        });
      });
    }
  }]);
  return MySql;
})();

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IGdldEluc2VydFZhbHVlcyA9ICh2YWx1ZXMpID0+IHtcbiAgY29uc3QgdmFsdWVzQXJyYXkgPSBbXVxuXG4gIGZvciAobGV0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICB2YWx1ZXNBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh2YWx1ZXNba2V5XSkpXG4gIH1cblxuICByZXR1cm4gdmFsdWVzQXJyYXkuam9pbigpXG59XG5cbmNvbnN0IHNxbFdoZXJlID0gKHdoZXJlKSA9PiB7XG4gIGlmICghd2hlcmUpIHJldHVyblxuXG4gIGNvbnN0IHdoZXJlQXJyYXkgPSBbXVxuXG4gIGZvciAobGV0IGtleSBpbiB3aGVyZSkge1xuICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCA9ICcgKyBteXNxbC5lc2NhcGUod2hlcmVba2V5XSkpXG4gIH1cblxuICByZXR1cm4gJ1dIRVJFICcgKyB3aGVyZUFycmF5LmpvaW4oJyBBTkQgJylcbn1cblxuY2xhc3MgTXlTcWwge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucyA9IHsgaG9zdDogJ2xvY2FsaG9zdCcgfSkge1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IG15c3FsLmNyZWF0ZUNvbm5lY3Rpb24ob3B0aW9ucylcbiAgICB0aGlzLnNxbFBhdGggPSBvcHRpb25zLnNxbFBhdGggfHwgJy4vc3FsJ1xuICB9XG5cbiAgc2VsZWN0IChzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICBfdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgdmFsdWVzLCAoZXJyLCByb3dzLCBmaWVsZHMpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzKHJvd3MsIGZpZWxkcylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgc2VsZWN0RmlsZSAoZmlsZW5hbWUsIHZhbHVlcyA9IHt9KSB7XG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXG5cbiAgICAvLyBHZXQgZnVsbCBwYXRoXG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5qb2luKFxuICAgICAgdGhpcy5zcWxQYXRoLFxuICAgICAgZmlsZW5hbWUgKyAocGF0aC5leHRuYW1lKGZpbGVuYW1lKSA9PT0gJy5zcWwnID8gJycgOiAnLnNxbCcpXG4gICAgKSlcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIC8vIFJlYWQgZmlsZSBhbmQgZXhlY3V0ZSBhcyBTUUwgc3RhdGVtZW50XG4gICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnLCAoZXJyLCBzcWwpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaignQ2Fubm90IGZpbmQ6ICcgKyBlcnIucGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzcWwgPSBzcWwucmVwbGFjZSgvXFxuKiQvbSwgJyAnKS5yZXBsYWNlKC8gJC8sICcnKVxuICAgICAgICAgIF90aGlzLnNlbGVjdChzcWwsIHZhbHVlcykudGhlbihyZXMpLmNhdGNoKHJlailcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgaW5zZXJ0ICh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7Z2V0SW5zZXJ0VmFsdWVzKHZhbHVlcyl9YFxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgKGVyciwgcm93cywgZmllbGRzKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyhyb3dzLmluc2VydElkKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICB1cGRhdGUgKHRhYmxlLCB2YWx1ZXMsIHdoZXJlLCBuZXh0KSB7XG4gICAgY29uc3Qgc3FsID0gYFVQREFURSBcXGAke3RhYmxlfVxcYCBTRVQgJHtnZXRJbnNlcnRWYWx1ZXModmFsdWVzKX0gJHtzcWxXaGVyZSh3aGVyZSl9YFxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgKGVyciwgcm93cywgZmllbGRzKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyhyb3dzLmFmZmVjdGVkUm93cylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE15U3FsXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsSUFBTSxlQUFlLEdBQUcsU0FBbEIsZUFBZSxDQUFJLE1BQU0sRUFBSztNQUM1QixXQUFXLEdBQUcsRUFBRSxDQUFBOztPQUVqQixJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7ZUFDWCxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FDakU7O1NBRU0sV0FBVyxDQUFDLElBQUksRUFB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