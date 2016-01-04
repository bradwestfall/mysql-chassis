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

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IGdldEluc2VydFZhbHVlcyA9ICh2YWx1ZXMpID0+IHtcbiAgY29uc3QgdmFsdWVzQXJyYXkgPSBbXVxuXG4gIGZvciAobGV0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICB2YWx1ZXNBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh2YWx1ZXNba2V5XSkpXG4gIH1cblxuICByZXR1cm4gdmFsdWVzQXJyYXkuam9pbigpXG59XG5cbmNvbnN0IHNxbFdoZXJlID0gKHdoZXJlKSA9PiB7XG4gIGlmICghd2hlcmUpIHJldHVyblxuXG4gIGNvbnN0IHdoZXJlQXJyYXkgPSBbXVxuXG4gIGZvciAobGV0IGtleSBpbiB3aGVyZSkge1xuICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCA9ICcgKyBteXNxbC5lc2NhcGUod2hlcmVba2V5XSkpXG4gIH1cblxuICByZXR1cm4gJ1dIRVJFICcgKyB3aGVyZUFycmF5LmpvaW4oJyBBTkQgJylcbn1cblxuY2xhc3MgTXlTcWwge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucyA9IHsgaG9zdDogJ2xvY2FsaG9zdCcgfSkge1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IG15c3FsLmNyZWF0ZUNvbm5lY3Rpb24ob3B0aW9ucylcbiAgICB0aGlzLnNxbFBhdGggPSBvcHRpb25zLnNxbFBhdGggfHwgJy4vc3FsJ1xuICB9XG5cbiAgc2VsZWN0IChzcWwsIHZhbHVlcywgbmV4dCA9IHZhbHVlcykge1xuICAgIGlmICh0eXBlb2YgdmFsdWVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YWx1ZXMgPSB7fVxuICAgIH1cblxuICAgIHRoaXMuY29ubmVjdGlvbi5xdWVyeShzcWwsIHZhbHVlcywgKGVyciwgcm93cywgZmllbGRzKSA9PiBuZXh0KGVyciwgcm93cywgZmllbGRzKSlcbiAgfVxuXG4gIHNlbGVjdEZpbGUgKGZpbGVuYW1lLCB2YWx1ZXMsIG5leHQgPSB2YWx1ZXMpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFsdWVzID0ge31cbiAgICB9XG5cbiAgICBjb25zdCBfdGhpcyA9IHRoaXNcblxuICAgIC8vIEdldCBmdWxsIHBhdGhcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmpvaW4oXG4gICAgICB0aGlzLnNxbFBhdGgsXG4gICAgICBmaWxlbmFtZSArIChwYXRoLmV4dG5hbWUoZmlsZW5hbWUpID09PSAnLnNxbCcgPyAnJyA6ICcuc3FsJylcbiAgICApKVxuXG4gICAgLy8gUmVhZCBmaWxlIGFuZCBleGVjdXRlIGFzIFNRTCBzdGF0ZW1lbnRcbiAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnLCAoZXJyLCBzcWwpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgbmV4dCgnQ2Fubm90IGZpbmQ6ICcgKyBlcnIucGF0aClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNxbCA9IHNxbC5yZXBsYWNlKC9cXG4qJC9tLCAnICcpLnJlcGxhY2UoLyAkLywgJycpXG4gICAgICAgIF90aGlzLnNlbGVjdChzcWwsIHZhbHVlcywgbmV4dClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgaW5zZXJ0ICh0YWJsZSwgdmFsdWVzLCBuZXh0KSB7XG4gICAgY29uc3Qgc3FsID0gYElOU0VSVCBJTlRPIFxcYCR7dGFibGV9XFxgIFNFVCAke2dldEluc2VydFZhbHVlcyh2YWx1ZXMpfWBcblxuICAgIHRoaXMuY29ubmVjdGlvbi5xdWVyeShzcWwsIChlcnIsIHJvd3MsIGZpZWxkcykgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBuZXh0KGVycilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQobnVsbCwgcm93cy5pbnNlcnRJZClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgdXBkYXRlICh0YWJsZSwgdmFsdWVzLCB3aGVyZSwgbmV4dCkge1xuICAgIGNvbnN0IHNxbCA9IGBVUERBVEUgXFxgJHt0YWJsZX1cXGAgU0VUICR7Z2V0SW5zZXJ0VmFsdWVzKHZhbHVlcyl9ICR7c3FsV2hlcmUod2hlcmUpfWBcblxuICAgIHRoaXMuY29ubmVjdGlvbi5xdWVyeShzcWwsIChlcnIsIHJvd3MsIGZpZWxkcykgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBuZXh0KGVycilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQobnVsbCwgcm93cy5hZmZlY3RlZFJvd3MpXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVNxbFxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLElBQU0sZUFBZSxHQUFHLFNBQWxCLGVBQWUsQ0FBSSxNQUFNLEVBQUs7TUFDNUIsV0FBVyxHQUFHLEVBQUUsQ0FBQTs7T0FFakIsSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO2VBQ1gsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQ2pFOztTQUVNLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtDQUMxQixDQUFBOztBQUVELElBQU0sUUFBUSxHQUFHLFNBQVgsUUFBUSxDQUFJLEtBQUssRUFBSztNQUN0QixDQUFDLEtBQUssRUFBRSxPQUFNOztNQUVaLFVBQVUsR0FBRyxFQUFFLENBQUE7O09BRWhCLElBQUksR0FBRyxJQUFJLEtBQUssRUFBRTtjQUNYLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUMvRDs7U0FFTSxRQUFRLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtDQUMzQyxDQUFBOztJQUVLLEtBQUs7V0FBTCxLQUFLLEdBQ3FDO1FBQWpDLE9BQU8seURBQUcsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFO3NDQUR4QyxLQUFLOztRQUVILENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUM3QyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQTtHQUMxQzs7MkJBSkcsS0FBSzs7MkJBTUQsR0FBRyxFQUFFLE1BQU0sRUFBaUI7VUFBZixJQUFJLHlEQUFHLE1BQU07O1VBQzVCLE9BQU8sTUFBTSxLQUFLLFVBQVUsRUFBRTtjQUMxQixHQUFHLEVBQUUsQ0FBQTtPQUNaOztVQUVHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNO2VBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDO09BQUEsQ0FBQyxDQUFBO0tBQ25GOzs7K0JBRVcsUUFBUSxFQUFFLE1BQU0sRUFBaUI7VUFBZixJQUFJLHlEQUFHLE1BQU07O1VBQ3JDLE9BQU8sTUFBTSxLQUFLLFVBQVUsRUFBRTtjQUMxQixHQUFHLEVBQUUsQ0FBQTtPQUNaOztVQUVLLEtBQUssR0FBRyxJQUFJOzs7VUFHWixRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUNyQyxJQUFJLENBQUMsT0FBTyxFQUNaLFFBQVEsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLE1BQU0sR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFBLENBQzVELENBQUM7OztRQUdBLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsVUFBQyxHQUFHLEVBQUUsR0FBRyxFQUFLO1lBQ3RDLEdBQUcsRUFBRTtjQUNILENBQUMsZUFBZSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUNqQyxNQUFNO2FBQ0YsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFBO2VBQzVDLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7U0FDaEM7T0FDRixDQUFDLENBQUE7S0FDSDs7OzJCQUVPLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1VBQ3JCLEdBQUcscUJBQW9CLEtBQUssY0FBVSxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUU7O1VBRWpFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsVUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBSztZQUM1QyxHQUFHLEVBQUU7Y0FDSCxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ1YsTUFBTTtjQUNELENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtTQUMxQjtPQUNGLENBQUMsQ0FBQTtLQUNIOzs7MkJBRU8sS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO1VBQzVCLEdBQUcsZ0JBQWUsS0FBSyxjQUFVLGVBQWUsQ0FBQyxNQUFNLENBQUMsU0FBSSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUU7O1VBRS9FLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsVUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBSztZQUM1QyxHQUFHLEVBQUU7Y0FDSCxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ1YsTUFBTTtjQUNELENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTtTQUM5QjtPQUNGLENBQUMsQ0FBQTtLQUNIOztTQTVERyxLQUFLOzs7In0=