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

function babelHelpers_toArray (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

function babelHelpers_toConsumableArray (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
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

      var values = undefined;

      if (arguments.length > 2) {
        var _args = args;

        var _args2 = babelHelpers_toArray(_args);

        values = _args2[0];
        args = _args2.slice(1);
      }

      (_connection = this.connection).query.apply(_connection, [MySql.queryFormat(sql, values)].concat(babelHelpers_toConsumableArray(args)));
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

      return query.replace(/\:(\w+)/gm, function (txt, key) {
        return values.hasOwnProperty(key) ? mysql.escape(values[key]) : txt;
      });
    }
  }]);
  return MySql;
})();

export default MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5lczIwMTUuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IGdldEluc2VydFZhbHVlcyA9ICh2YWx1ZXMpID0+IHtcbiAgY29uc3QgdmFsdWVzQXJyYXkgPSBbXVxuXG4gIGZvciAobGV0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICB2YWx1ZXNBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh2YWx1ZXNba2V5XSkpXG4gIH1cblxuICByZXR1cm4gdmFsdWVzQXJyYXkuam9pbigpXG59XG5cbmNvbnN0IHNxbFdoZXJlID0gKHdoZXJlKSA9PiB7XG4gIGlmICghd2hlcmUpIHJldHVyblxuXG4gIGNvbnN0IHdoZXJlQXJyYXkgPSBbXVxuXG4gIGZvciAobGV0IGtleSBpbiB3aGVyZSkge1xuICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCA9ICcgKyBteXNxbC5lc2NhcGUod2hlcmVba2V5XSkpXG4gIH1cblxuICByZXR1cm4gJ1dIRVJFICcgKyB3aGVyZUFycmF5LmpvaW4oJyBBTkQgJylcbn1cblxuY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gIGZpZWxkQ291bnQ6IDAsXG4gIGFmZmVjdGVkUm93czogMCxcbiAgaW5zZXJ0SWQ6IDAsXG4gIGNoYW5nZWRSb3dzOiAwLFxuICByb3dzOiBbXSxcbiAgZmllbGRzOiBbXVxufVxuXG5jbGFzcyBNeVNxbCB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zID0geyBob3N0OiAnbG9jYWxob3N0JyB9KSB7XG4gICAgdGhpcy5jb25uZWN0aW9uID0gbXlzcWwuY3JlYXRlQ29ubmVjdGlvbihvcHRpb25zKVxuICAgIHRoaXMuc3FsUGF0aCA9IG9wdGlvbnMuc3FsUGF0aCB8fCAnLi9zcWwnXG4gIH1cblxuICBzdGF0aWMgcXVlcnlGb3JtYXQgKHF1ZXJ5LCB2YWx1ZXMpIHtcbiAgICBpZiAoIXZhbHVlcykge1xuICAgICAgcmV0dXJuIHF1ZXJ5XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXJ5LnJlcGxhY2UoL1xcOihcXHcrKS9nbSwgKHR4dCwga2V5KSA9PlxuICAgICAgdmFsdWVzLmhhc093blByb3BlcnR5KGtleSkgPyBteXNxbC5lc2NhcGUodmFsdWVzW2tleV0pIDogdHh0XG4gICAgKVxuICB9XG5cbiAgcXVlcnkgKHNxbCwgLi4uYXJncykge1xuICAgIGxldCB2YWx1ZXNcblxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgWyB2YWx1ZXMsIC4uLmFyZ3MgXSA9IGFyZ3NcbiAgICB9XG5cbiAgICB0aGlzLmNvbm5lY3Rpb24ucXVlcnkoTXlTcWwucXVlcnlGb3JtYXQoc3FsLCB2YWx1ZXMpLCAuLi5hcmdzKVxuICB9XG5cbiAgc2VsZWN0IChzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdGhpcy5xdWVyeShzcWwsIHZhbHVlcywgKGVyciwgcm93cywgZmllbGRzID0gW10pID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYWRkIHJvd3MgZGlyZWN0bHkgaWYgaXQncyBhbiBhcnJheSwgb3RoZXJ3aXNlIGFzc2lnbiB0aGVtIGluXG4gICAgICAgICAgcmVzKHJvd3MubGVuZ3RoID8geyAuLi5yZXNwb25zZU9iaiwgZmllbGRzLCByb3dzIH0gOiB7IC4uLnJlc3BvbnNlT2JqLCBmaWVsZHMsIC4uLnJvd3MgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgc2VsZWN0RmlsZSAoZmlsZW5hbWUsIHZhbHVlcyA9IHt9KSB7XG4gICAgLy8gR2V0IGZ1bGwgcGF0aFxuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguam9pbihcbiAgICAgIHRoaXMuc3FsUGF0aCxcbiAgICAgIGZpbGVuYW1lICsgKHBhdGguZXh0bmFtZShmaWxlbmFtZSkgPT09ICcuc3FsJyA/ICcnIDogJy5zcWwnKVxuICAgICkpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAvLyBSZWFkIGZpbGUgYW5kIGV4ZWN1dGUgYXMgU1FMIHN0YXRlbWVudFxuICAgICAgZnMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGY4JywgKGVyciwgc3FsKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooJ0Nhbm5vdCBmaW5kOiAnICsgZXJyLnBhdGgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3FsID0gc3FsLnJlcGxhY2UoL1xcbiokL20sICcgJykucmVwbGFjZSgvICQvLCAnJylcbiAgICAgICAgICB0aGlzLnNlbGVjdChzcWwsIHZhbHVlcykudGhlbihyZXMpLmNhdGNoKHJlailcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgaW5zZXJ0ICh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7Z2V0SW5zZXJ0VmFsdWVzKHZhbHVlcyl9YFxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdGhpcy5xdWVyeShzcWwsIChlcnIsIHJlc3VsdCwgZmllbGRzKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyhyZXN1bHQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHVwZGF0ZSAodGFibGUsIHZhbHVlcywgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgVVBEQVRFIFxcYCR7dGFibGV9XFxgIFNFVCAke2dldEluc2VydFZhbHVlcyh2YWx1ZXMpfSAke3NxbFdoZXJlKHdoZXJlKX1gXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICB0aGlzLnF1ZXJ5KHNxbCwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWooZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyhyZXN1bHQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIGRlbGV0ZSAodGFibGUsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYERFTEVURSBGUk9NIFxcYCR7dGFibGV9XFxgICR7c3FsV2hlcmUod2hlcmUpfWBcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHRoaXMucXVlcnkoc3FsLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzKHJlc3VsdClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE15U3FsXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLElBQU0sZUFBZSxHQUFHLFNBQWxCLGVBQWUsQ0FBSSxNQUFNLEVBQUs7TUFDNUIsV0FBVyxHQUFHLEVBQUUsQ0FBQTs7T0FFakIsSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO2VBQ1gsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQ2pFOztTQUVNLFdBQVcsQ0FBQyxJ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