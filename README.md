# Node MySQL Chassis

Node MySQL Chassis wrapps [node-mysql](https://github.com/felixge/node-mysql) and provides a small abstraction layer to write SQL more easily

## Install

```
npm install --save mysql-chassis
```

## Initialize

```js
var db = require('mysql-chassis');

db.init({
    host: 'localhost',         // optional, defaults to localhost
    database: 'databasename',
    user: 'username',
    password: '',
    sqlPath: './sql'           // optional
});
```

## Usage

#### .select(sql, callback)

Call without binding SQL values:

```js
db.select('SELECT * FROM user', function(err, rows, fields) {
  // err will have node-mysql's error if applicable
  // rows is always an array of objects returned from the query. It will be an empty array if no results
  // fields is the field data if applicable
});
```

#### .select(sql, values, callback)

Safely bind values to SQL:

```js
var values = {id: 1};
db.select('SELECT * FROM user WHERE user_id = :id', values, function(err, rows, fields) {
  ...
});
```

#### .selectFile(filename, values, callback)

`.selectFile()` works almost exaclty like `.select()` except it takes a filename instead of SQL:

```js
var values = {id: 1};
db.selectFile('user.sql', values, function(err, rows, fields) {
  ...
});
```

Note that the filename can writen with or without the `.sql` extension. The file will be found in the `sqlPath` as set during initialization. Using files to store SQL will allow developers to write multiline SQL as follows:

user.sql:
```sql
SELECT name
FROM user
WHERE user_id = :id
```
