# Node MySQL Chassis

Node MySQL Chassis wraps [node-mysql](https://github.com/felixge/node-mysql) and provides a small abstraction layer to write SQL more easily. Note that I still have a lot of ideas and work to do here. It's in early release. This project will never turn into an ORM or a Model, but rather it would be a good fit for an ORM or Model to use. Contributions welcome.

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
  // err: Will have node-mysql's error if applicable
  // rows: Is always an array of objects returned from the query. It will be an empty array if no results
  // fields: Is the field data if applicable
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

`.selectFile()` works almost exactly like `.select()` except it takes a filename instead of SQL:

```js
var values = {id: 1};
db.selectFile('user.sql', values, function(err, rows, fields) {
  ...
});
```

Note that the filename can written with or without the `.sql` extension. The file will be found in the `sqlPath` as set during initialization. Using files to store SQL will allow developers to write multiline SQL as follows:

user.sql:
```sql
SELECT name
FROM user
WHERE user_id = :id
```

### .insert(table, values, callback)

This method will write your `INSERT` statement. The example assumes database columns: `name` and `email`

```js
var values = {name: 'Brad', email: 'brad@foobar.com'};
db.insert('user', values, function(err, id) {
  // err: (same as select)
  // id: The Insert ID
});
```

### .update(table, values, where, callback)

This method will write your `UPDATE` statement. Let's update my name:

```js
var values = {name: 'Bradley'};
db.update('user', values, {user_id: 1}, function(err, affectedRows) {
  // err: (same as select)
  // affectedRows: The number of affected rows
});
```

Notice that the `where` argument is an object. This will convert to `WHERE user_id = 1`





