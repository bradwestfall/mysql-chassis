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

module.exports = MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlzcWwtY2hhc3Npcy5qcyIsInNvdXJjZXMiOlsiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuY29uc3QgZ2V0SW5zZXJ0VmFsdWVzID0gKHZhbHVlcykgPT4ge1xuICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG5cbiAgZm9yIChsZXQga2V5IGluIHZhbHVlcykge1xuICAgIHZhbHVlc0FycmF5LnB1c2goJ2AnICsga2V5ICsgJ2AgPSAnICsgbXlzcWwuZXNjYXBlKHZhbHVlc1trZXldKSlcbiAgfVxuXG4gIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbn1cblxuY29uc3Qgc3FsV2hlcmUgPSAod2hlcmUpID0+IHtcbiAgaWYgKCF3aGVyZSkgcmV0dXJuXG5cbiAgY29uc3Qgd2hlcmVBcnJheSA9IFtdXG5cbiAgZm9yIChsZXQga2V5IGluIHdoZXJlKSB7XG4gICAgd2hlcmVBcnJheS5wdXNoKCdgJyArIGtleSArICdgID0gJyArIG15c3FsLmVzY2FwZSh3aGVyZVtrZXldKSlcbiAgfVxuXG4gIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxufVxuXG5jb25zdCByZXNwb25zZU9iaiA9IHtcbiAgZmllbGRDb3VudDogMCxcbiAgYWZmZWN0ZWRSb3dzOiAwLFxuICBpbnNlcnRJZDogMCxcbiAgY2hhbmdlZFJvd3M6IDAsXG4gIHJvd3M6IFtdLFxuICBmaWVsZHM6IFtdXG59XG5cbmNsYXNzIE15U3FsIHtcbiAgY29uc3RydWN0b3IgKG9wdGlvbnMgPSB7IGhvc3Q6ICdsb2NhbGhvc3QnIH0pIHtcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBteXNxbC5jcmVhdGVDb25uZWN0aW9uKG9wdGlvbnMpXG4gICAgdGhpcy5zcWxQYXRoID0gb3B0aW9ucy5zcWxQYXRoIHx8ICcuL3NxbCdcbiAgfVxuXG4gIHN0YXRpYyBxdWVyeUZvcm1hdCAocXVlcnksIHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSB7XG4gICAgICByZXR1cm4gcXVlcnlcbiAgICB9XG5cbiAgICByZXR1cm4gcXVlcnkucmVwbGFjZSgvXFw6KFxcdyspL2dtLCAodHh0LCBrZXkpID0+XG4gICAgICB2YWx1ZXMuaGFzT3duUHJvcGVydHkoa2V5KSA/IG15c3FsLmVzY2FwZSh2YWx1ZXNba2V5XSkgOiB0eHRcbiAgICApXG4gIH1cblxuICBxdWVyeSAoc3FsLCAuLi5hcmdzKSB7XG4gICAgbGV0IHZhbHVlc1xuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICBbIHZhbHVlcywgLi4uYXJncyBdID0gYXJnc1xuICAgIH1cblxuICAgIHRoaXMuY29ubmVjdGlvbi5xdWVyeShNeVNxbC5xdWVyeUZvcm1hdChzcWwsIHZhbHVlcyksIC4uLmFyZ3MpXG4gIH1cblxuICBzZWxlY3QgKHNxbCwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICB0aGlzLnF1ZXJ5KHNxbCwgdmFsdWVzLCAoZXJyLCByb3dzLCBmaWVsZHMgPSBbXSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKGVycilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBhZGQgcm93cyBkaXJlY3RseSBpZiBpdCdzIGFuIGFycmF5LCBvdGhlcndpc2UgYXNzaWduIHRoZW0gaW5cbiAgICAgICAgICByZXMocm93cy5sZW5ndGggPyB7IC4uLnJlc3BvbnNlT2JqLCBmaWVsZHMsIHJvd3MgfSA6IHsgLi4ucmVzcG9uc2VPYmosIGZpZWxkcywgLi4ucm93cyB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBzZWxlY3RGaWxlIChmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICAvLyBHZXQgZnVsbCBwYXRoXG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5qb2luKFxuICAgICAgdGhpcy5zcWxQYXRoLFxuICAgICAgZmlsZW5hbWUgKyAocGF0aC5leHRuYW1lKGZpbGVuYW1lKSA9PT0gJy5zcWwnID8gJycgOiAnLnNxbCcpXG4gICAgKSlcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIC8vIFJlYWQgZmlsZSBhbmQgZXhlY3V0ZSBhcyBTUUwgc3RhdGVtZW50XG4gICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgJ3V0ZjgnLCAoZXJyLCBzcWwpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaignQ2Fubm90IGZpbmQ6ICcgKyBlcnIucGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzcWwgPSBzcWwucmVwbGFjZSgvXFxuKiQvbSwgJyAnKS5yZXBsYWNlKC8gJC8sICcnKVxuICAgICAgICAgIHRoaXMuc2VsZWN0KHNxbCwgdmFsdWVzKS50aGVuKHJlcykuY2F0Y2gocmVqKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBpbnNlcnQgKHRhYmxlLCB2YWx1ZXMgPSB7fSkge1xuICAgIGNvbnN0IHNxbCA9IGBJTlNFUlQgSU5UTyBcXGAke3RhYmxlfVxcYCBTRVQgJHtnZXRJbnNlcnRWYWx1ZXModmFsdWVzKX1gXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICB0aGlzLnF1ZXJ5KHNxbCwgKGVyciwgcmVzdWx0LCBmaWVsZHMpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzKHJlc3VsdClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgdXBkYXRlICh0YWJsZSwgdmFsdWVzLCB3aGVyZSkge1xuICAgIGNvbnN0IHNxbCA9IGBVUERBVEUgXFxgJHt0YWJsZX1cXGAgU0VUICR7Z2V0SW5zZXJ0VmFsdWVzKHZhbHVlcyl9ICR7c3FsV2hlcmUod2hlcmUpfWBcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHRoaXMucXVlcnkoc3FsLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaihlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzKHJlc3VsdClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgZGVsZXRlICh0YWJsZSwgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgREVMRVRFIEZST00gXFxgJHt0YWJsZX1cXGAgJHtzcWxXaGVyZSh3aGVyZSl9YFxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdGhpcy5xdWVyeShzcWwsIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKGVycilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXMocmVzdWx0KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlTcWxcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxJQUFNLGVBQWUsR0FBRyxTQUFsQixlQUFlLENBQUksTUFBTSxFQUFLO01BQzVCLFdBQVcsR0FBRyxFQUFFLENBQUE7O09BRWpCLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtlQUNYLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUNqRTs7U0FFTSxXQUFXLENBQUMsSUFB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