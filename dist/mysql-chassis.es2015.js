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

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IGdldEluc2VydFZhbHVlcyA9ICh2YWx1ZXMpID0+IHtcbiAgY29uc3QgdmFsdWVzQXJyYXkgPSBbXVxuXG4gIGZvciAobGV0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICB2YWx1ZXNBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh2YWx1ZXNba2V5XSkpXG4gIH1cblxuICByZXR1cm4gdmFsdWVzQXJyYXkuam9pbigpXG59XG5cbmNvbnN0IHNxbFdoZXJlID0gKHdoZXJlKSA9PiB7XG4gIGlmICghd2hlcmUpIHJldHVyblxuXG4gIGNvbnN0IHdoZXJlQXJyYXkgPSBbXVxuXG4gIGZvciAobGV0IGtleSBpbiB3aGVyZSkge1xuICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCA9ICcgKyBteXNxbC5lc2NhcGUod2hlcmVba2V5XSkpXG4gIH1cblxuICByZXR1cm4gJ1dIRVJFICcgKyB3aGVyZUFycmF5LmpvaW4oJyBBTkQgJylcbn1cblxuY2xhc3MgTXlTcWwge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucyA9IHsgaG9zdDogJ2xvY2FsaG9zdCcgfSkge1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IG15c3FsLmNyZWF0ZUNvbm5lY3Rpb24ob3B0aW9ucylcbiAgICB0aGlzLnNxbFBhdGggPSBvcHRpb25zLnNxbFBhdGggfHwgJy4vc3FsJ1xuICB9XG5cbiAgc2VsZWN0IChzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICBfdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgdmFsdWVzLCAoZXJyLCByb3dzLCBmaWVsZHMpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzKHJvd3MsIGZpZWxkcylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgc2VsZWN0RmlsZSAoZmlsZW5hbWUsIHZhbHVlcyA9IHt9KSB7XG4gICAgY29uc3QgX3RoaXMgPSB0aGlzXG5cbiAgICAvLyBHZXQgZnVsbCBwYXRoXG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5qb2luKFxuICAgICAgdGhpcy5zcWxQYXRoLFxuICAgICAgZmlsZW5hbWUgKyAocGF0aC5leHRuYW1lKGZpbGVuYW1lKSA9PT0gJy5zcWwnID8gJycgOiAnLnNxbCcpXG4gICAgKSlcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIC8vIFJlYWQgZmlsZSBhbmQgZXhlY3V0ZSBhcyBTUUwgc3RhdGVtZW50XG4gICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnLCAoZXJyLCBzcWwpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaignQ2Fubm90IGZpbmQ6ICcgKyBlcnIucGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzcWwgPSBzcWwucmVwbGFjZSgvXFxuKiQvbSwgJyAnKS5yZXBsYWNlKC8gJC8sICcnKVxuICAgICAgICAgIF90aGlzLnNlbGVjdChzcWwsIHZhbHVlcykudGhlbihyZXMpLmNhdGNoKHJlailcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgaW5zZXJ0ICh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7Z2V0SW5zZXJ0VmFsdWVzKHZhbHVlcyl9YFxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgX3RoaXMuY29ubmVjdGlvbi5xdWVyeShzcWwsIChlcnIsIHJlc3VsdCwgZmllbGRzKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyhyZXN1bHQuaW5zZXJ0SWQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHVwZGF0ZSAodGFibGUsIHZhbHVlcywgd2hlcmUpIHtcbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgICBjb25zdCBzcWwgPSBgVVBEQVRFIFxcYCR7dGFibGV9XFxgIFNFVCAke2dldEluc2VydFZhbHVlcyh2YWx1ZXMpfSAke3NxbFdoZXJlKHdoZXJlKX1gXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICBfdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyhyZXN1bHQuYWZmZWN0ZWRSb3dzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBkZWxldGUgKHRhYmxlLCB3aGVyZSkge1xuICAgIGNvbnN0IF90aGlzID0gdGhpc1xuICAgIGNvbnN0IHNxbCA9IGBERUxFVEUgRlJPTSBcXGAke3RhYmxlfVxcYCAke3NxbFdoZXJlKHdoZXJlKX1gXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICBfdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KHNxbCwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyhyZXN1bHQuYWZmZWN0ZWRSb3dzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlTcWxcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxJQUFNLGVBQWUsR0FBRyxTQUFsQixlQUFlLENBQUksTUFBTSxFQUFLO01BQzVCLFdBQVcsR0FBRyxFQUFFLENBQUE7O09BRWpCLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtlQUNYLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUNqRTs7U0FFTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUE7Q0FDMUIsQ0FBQTs7QUFFRCxJQUFNLFFBQVEsR0FBRyxTQUFYLFFBQVEsQ0FBSSxLQUFLLEVBQUs7TUFDdEIsQ0FBQyxLQUFLLEVBQUUsT0FBTTs7TUFFWixVQUFVLEdBQUcsRUFBRSxDQUFBOztPQUVoQixJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUU7Y0FDWCxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FDL0Q7O1NBRU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7Q0FDM0MsQ0FBQTs7SUFFSyxLQUFLO1dBQUwsS0FBSyxHQUNxQztRQUFqQyxPQUFPLHlEQUFHLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtzQ0FEeEMsS0FBSzs7UUFFSCxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDN0MsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUE7R0FD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