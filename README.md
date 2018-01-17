# MySQL Chassis

[![Build Status](https://travis-ci.org/bradwestfall/mysql-chassis.svg?branch=master)](https://travis-ci.org/bradwestfall/mysql-chassis)

A promise-based API for [mysqljs](https://github.com/mysqljs/mysql) (`mysqljs` is formerly called `node-mysql`). It provides easy SQL methods including:

- [db.query()](#dbquerysql-bindvalues)
- [db.queryFile()](#dbqueryfilefilename-bindvalues)
- [db.select()](#dbselectsql-bindvalues)
- [db.selectFile()](#dbselectfilefilename-bindvalues)
- [db.selectWhere()](#dbselectwherefields-table-whereclause)
- [db.insert()](#dbinserttablename-insertvalues)
- [db.insertMultiple](#dbinsertmultipletablename-values-columntemplate)
- [db.update()](#dbupdatetablename-updatevalues-whereclause)
- [db.insertIgnore()](#dbinsertignoretablename-insertvalues)
- [db.insertUpdate()](#dbinsertupdatetablename-values)
- [db.delete()](#dbdeletetablename-whereclause)
- [db.sqlWhere()](#dbsqlwherewhereclause)

It also provides a middleware layer for [db.onBeforeResults](https://github.com/bradwestfall/node-mysql-chassis#middleware) and [db.onResults](https://github.com/bradwestfall/node-mysql-chassis#middleware).

Key features:
- Promise-based layer over [mysqljs](https://github.com/mysqljs/mysql)
- External SQL files
- Named bind-parameter placeholders, similar to what [PDO offers](http://php.net/manual/en/pdostatement.bindparam.php)
- Better results for `SELECT ... LIMIT BY 1` (see middleware)
- SQL templates with EJS (see middleware)
- "Transforms Feature" to normalize JS to SQL


## Install

```
npm install --save mysql-chassis
```

## Connect

Quickstart Example:

```js
// Non-ES6
// var MySQl = require('mysql-chassis').default;

// ES6
import MySQL from 'mysql-chassis';

const db = new MySQL({
  database: 'databasename',
  user: 'username'
});
```

> Note that if you don't provide `password` or `host` options, MySQL Chassis will pass an empty string as the password and `mysqljs` already passes `localhost` by default.

The options passed in are a blend of MySQL Chassis and `mysqljs` options. Any options that `mysqljs` [createConnection()](https://github.com/mysqljs/mysql#introduction) or [createPool()](https://github.com/mysqljs/mysql#pooling-connections) can receive will be passed through. Access to the `mysqljs` underlying connection (pooled or un-pooled) is given as follows:


```js
const db = new MySQL({
  database: 'databasename',
  user: 'username'
});

// mysqljs' connection object
db.connection
```

### MySQL Chassis Connection Options

As stated before, the options passed into MySQL Chassis are a blend of MySQL Chassis options and the underlying `mysqljs` library. See [their connection options](https://github.com/mysqljs/mysql#connection-options) for more details. For MySQL Chassis, here are the options:

- `password`: Even though this is a `mysqljs` option, we just want to note that if this is omitted, then `null` is sent to `mysqljs`.
- `sqlPath`: A filepath where SQL files can be found. This is used by `selectFile()` and `queryFile()`. If no value is passed. Default value is `./sql`
- `retryLimit`: How many times should MySQL Chassis try to re-connect if a connection is not made initially, or if a connection is lost. Default value is `Infinity`
- `transforms`: An object for transform settings. See [Transforms](#transforms) below.

### Example Connection

Here's a more elaborate example of what your connection to MySQL Chassis might look like

```js
import MySQL from 'mysql-chassis';
import path from 'path';

const db = new MySQL({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  sqlPath: path.join(process.cwd(), './sql')
});

db.on('connectionAttempt', tries => {
  console.log(`MySQL Chassis: Trying to connect. Try: ${tries}`)
});

db.on('connectionSuccess', tries => {
  console.log(`MySQL Chassis: Connection Success. Try: ${tries}`)
});

db.on('connectionError', err => {
  console.error('MySQL Chassis: Could not establish connection. Code:', err.code)
});

db.on('connectionLost', err => {
  console.error('MySQL Chassis: Connection was lost. Code:', err.code)
});

db.on('connectionTriesLimitReached', tries => {
  console.error(`MySQL Chassis: Quit trying to connect after ${tries} tries`)
});

db.on('sqlError', err => {
  console.error(`MySQL Chassis: SQL Error`, { SQL: err.sql, Code: err.code })
});

// SELECT a user

const userId = 1
db.selectFile('SELECT * FROM user WHERE user_id = :userId LIMIT 1', { userId })
  .then(row => console.log(row))
  .catch(err => console.error(err));

export default db;
```

See the `.queryFile()` and `.selectFile()` method below for an example of how to use SQL statements as files instead of inline strings.


## Results

All query execution methods return a promise with the results of the SQL:

```js
db.query('SELECT * FROM user').then(function(results) {
  console.log(results)
}).catch(err => {
  console.log(err)
})
```

When a `SELECT` statement is passed in, the `results` will contain the following properties:

- `rows`: The same data that `mysqljs` would give you
- `fields`: The same data that `mysqljs` would give you
- `sql`: The SQL which was executed.

For non-`SELECT` statements, the `results` returned will be the same as `mysqljs` results which can contain any of the following properties depending on what type of SQL was performed:

- `affectedRows`
- `insertId`
- `changedRows`
- `fieldCount`
- `serverStatus`
- `warningCount`
- `message`

In addition to these, there will also be a `sql` property returned in the `results`. The purpose of returning the SQL statement in the results is mostly for debugging. Many of the methods below allow you to do [PDO-Style](http://php.net/manual/en/pdostatement.bindparam.php) bound parameters, and some methods will even write your SQL for you if you choose to use those features. So it's nice to know what eventual SQL was executed.

### Errors

If there's an error, the promise `.catch(err)` will give you:

- `err`: The error provided by `mysqljs`
- `sql`: The SQL which was executed


## API Methods

### db.query(sql, [bindValues])

`query()` can be used to execute any type of SQL. If the query is an `SELECT` statement, you can access the rows returned via `result.rows`:

```js
db.query('SELECT * FROM user')
  .then(result => console.log(result.rows));
```

If you need to pass dynamic values into your query, use the `bindValues` option which will properly escape the values with `mysqljs`'s `connection.escape()` method.

```js
const bindValues = { id: 1 };
db.query('SELECT * FROM user WHERE user_id = :id', bindValues);
```

When you use the `bindValues` option, you'll also use placeholders in your SQL (such as `:id`) to map where the values should be placed.


<hr>

### db.queryFile(filename, [bindValues])

Works just like `query()` except it allows you to pass a filename instead of SQL directly. The filename will be appended to your `sqlPath` settings (configured at the time of connection, [see above](#connect))

As an example:

```js
const bindValues = { id: 1 };
db.queryFile('somefile', bindValues);
```

This assumes `somefile.sql` exists in the `sqlPath` folder and looks like this:

```sql
SELECT * FROM user WHERE user_id = :id
```

If the file exists, `.queryFile()` will behave exactly like `.query()`

Also, if you want to organize your SQL files into sub folders of the `sqlPath`, you can access those files as:

```js
const bindValues = { id: 1 };
db.queryFile('path/to/somefile', bindValues)
```

`path/to` in this case is relative to the path supplied by `sqlPath`.

> Note that the filename can written with or without the `.sql` extension. If no extension is provided, then `.sql` will be added to your filename.

<hr>

### db.select(sql, [bindValues])

Works just like `.query()` except it will return only the `rows` from the promise instead of a `results` object that contains `rows` with other meta data. Also it's only meant to be used on `SELECT` statements.

Use `.select()` over `.query()` if
- You are running a `SELECT` statement, and
- You don't care about the extra meta data returned from `.query()`

As a proof of concept, these two method calls would output the same data for `rows`:

```js
db.select('SELECT * FROM user')
  .then(rows => console.log(rows))

db.query('SELECT * FROM user')
  .then(results => console.log(results.rows))
```

<hr>

### db.selectFile(filename, [bindValues])

Works just like `.queryFile()` in the sense that you can pass a filename in, but works like `.select()` in the sense of how it returns `rows` instead of `results`.


### db.selectWhere(fields, table, whereClause)

Creates a `SELECT ${fields} FROM ${table} ${where}` statement and runs it through `.select()`

- `fields`: Can be a comma delimited string or an array of strings. Either way, the fields will be normalized with backticks (in case you have any MySQL reserved words) and trimmed of whitespace.
- `table`: Must be a string.
- `where`: (optional) Uses `.sqlWhere()` to build a `WHERE`. See docs below for more on `.sqlWhere()`.

<hr>

### db.insert(tableName, insertValues)

This method will write your `INSERT` statement for you and then return the results of `.query()`. Here's how we can execute an `INSERT` statement for a user with `name` and `email` fields:

```js
const insertValues = {name: 'Brad', email: 'brad@foobar.com'};

db.insert('user', insertValues)
  .then(results => console.log(results.insertId));
```

The `INSERT` statement executed would be:

```sql
INSERT INTO user
SET `name` = 'Brad', `email` = 'brad@foobar.com'
```

<hr>

### db.insertMultiple(tableName, values, columnTemplate)

Allows multiple inserts to be performed in one SQL statement (better for performance than looping and creating individual inserts when many are needed). Similar to:

```sql
INSERT INTO `some_table`
  (col1, col2, col3)
VALUES
  (1,2,3),
  (4,5,6),
  (7,8,9)
```

- `table`: Must be a string.
- `values`: Must be an array of objects, where each object represents the column name and values to be inserted into a new row. Note that the order of the properties in `values` does not determine their placement in the SQL statement. The order that is used in the SQL statement depends on `columnTemplate` and the algorithm will map the keys of the `values` objects to the `columnTemplate`.
- `columnTemplate`: (optional) Must be an array of unique column names. This will be used as the "columns" section of the SQL statement. If not provided, this method will use the fields of the first object in `values` to make the `columnTemplate`

Here's an example:

```js
const insertValues = [
  { datetime_added: 'NOW()', first_name: 'Brad' },
  { first_name: 'Dave', last_name: 'Smith', datetime_added: 'NOW()' }
];

db.insertMultiple('user', insertValues, ['first_name', 'last_name', 'datetime_added'])
  .then(response => console.log(response))
  .catch(err => console.log(err));
```

As you can see, the "uniformity" of the two objects for `values` do not match. That is okay in this case because we provided the last argument, an array indicating which columns we want. However, without that array, we would not get the desired result since the first object's keys `datetime_added` and `first_name` would be used as the column template, and therefore leaving the `first_name` out of the second insert. So always provide the third `columnTemplate` argument if you can.

<hr>

### db.update(tableName, updateValues, whereClause)

This method will write your `UPDATE` statement for you and then return the results of `.query()`. Here's how we can execute an `UPDATE` statement for a user to update `name` and `email` fields:

```js
const updateValues = { name: 'Brad', email: 'brad@foobar.com' };
const whereClause = { user_id: 1, active: true };

db.update('user', updateValues, whereClause).then(function(results) {
  console.log(results.changedRows)
});
```

The `UPDATE` statement executed would be:

```sql
UPDATE user
SET `name` = 'Brad', `email` = 'brad@foobar.com'
WHERE `user_id` = 1
AND `active` = true
```

See more on `.where()` below.

<hr>

### db.insertIgnore(tableName, insertValues)

Same as `.insert()`, but if they primary key already exists, then the `INSERT` will be ignored. This will not produce an error or warning.

This relies on MySQL's `INSERT IGNORE` feature.

<hr>

### db.insertUpdate(tableName, values)

Attempt an `INSERT` statement, but of the primary key already exists and therefore the record cannot be inserted, then switch to an `UPDATE` statement.

This relies on MySQL's `ON DUPLICATE KEY UPDATE` feature.

<hr>

### db.delete(tableName, whereClause)

This method will write your `DELETE` statement for you and returns the same promise as `query()`.

```js
const whereClause = { user_id: 1, active: true };

db.delete('user', whereClause)
  .then(results => console.log(results.affectedRows));
```

The `DELETE` statement executed would be:

```sql
DELETE FROM user
WHERE `user_id` = 1
AND `active` = true
```

See more on `.sqlWhere()` below.

<hr>

### db.sqlWhere(whereClause)

This method is normally used by other API methods, such as `.update()`, and `.delete()`. You can also use it directly:

```js
console.log(db.sqlWhere({
  user_id: 1
  active: true
})) // outputs: WHERE `user_id` = 1 AND `active` = true
```

Values passed in will be escaped using `mysqljs`'s `connection.escape()` method.

If a string is passed in, the string will be returned without changes and without escaping. This allows you to write custom "where-clauses" as needed:

```js
db.update('user', updateValues, 'WHERE user.datetime_added < NOW()');
```

<hr>

## Middleware

For custom functionality, you can add middleware to be ran before or after queries are executed:

```js
db.onBeforeQuery((sql, bindValues) => {
  // Here you can modify the SQL before it is ran
  return sql;
});

db.onResults((sql, results) => {
  // Here you can modify the results before they are returned
  return results;
});
```

### Middleware Examples

__Example 1__: `mysqljs` always returns an array of rows regardless of how many rows are returned. But if you wanted to modify the results such that when the `SELECT` statement has a `LIMIT 1` at the end, then it will just return an object for the one row, then this is how that could be done:

```js
db.onResults((sql, results) => {
  if (results.length !== 1) return results;
  return /^SELECT\s(.|\n)+LIMIT 1$/g.test(sql.trim()) ? results[0] : results;
});
```

__Example 2__: If you feel inclined to treat your SQL files as templates which can be dynamic depending on the `bindValues`, you can use middleware with [ejs templates](https://github.com/mde/ejs)

```js
db.onBeforeQuery((sql, bindValues) => {
  sql = ejs.compile(sql)(bindValues);
  return sql;
});
```

Now, your SQL statements can be written as follows:

```sql
# file.sql
SELECT *
FROM user
WHERE user_id = :id
<% if (active) { %>
  AND active = true
<% } %>
```

Now, running the following will result in the `AND active = true` part of the SQL running

```js
db.select('file', { id: 1, active: true });
```

<hr>

## Transforms

Transforms are a means of helping `.insert()` and `.update()` methods know what to do when then encounter values that won't go well with MySQL. The transforms object is a map of values that `.insert()` and `.update()` could encounter, and what real values we'd rather use in the creation of the SQL statement.

The default transforms are:

```js
transforms: {
  undefined: 'NULL',
  '': 'NULL',
  'NOW()': 'NOW()',
  'CURTIME()': 'CURTIME()'
};
```

As an example, let's say we pass `undefined` or an empty string into our `.insert()` method:

```js
db.insert('user', { name: '', email: undefined });
```

Ideally for MySQL, you would want those values transformed to MySQL's `NULL`

```sql
# With Transforms (ideal)
INSERT INTO user
SET `name` = NULL, `email` = NULL

# Without Transforms (not ideal)
INSERT INTO user
SET `name` = '', `email` = ''
```

Note that escaping does not occur on transformed values. The value of the transform is placed directly inside the SQL statement whenever a `bindValues` value matches a transform key.

As another example, let's say you want to be able to pass the `NOW()` or `CURTIME()` MySQL functions as values into your `.insert()` or `.update()` methods. As you can see, the transforms allow you to write:

```js
db.insert('user', {name: 'Brad', datetime_added: 'NOW()'});
```

Which will result in:

```sql
# With Transforms (ideal)
INSERT INTO user
SET `name` = 'Brad', `datetime_added` = NOW()

# Without Transforms (will cause an error if datetime_added expects a valid date)
INSERT INTO user
SET `name` = 'Brad', `datetime_added` = 'NOW()'
```

### Custom Transforms

You can modify the default transforms or add your own at connection time:

```js
const db = new MySQL({
  database: 'databasename',
  user: 'username',
  transforms: {
    'lookForThisValue': 'replaceWithThisValue', // Custom
    '': 'Empty Value' // Override default
  }
});
```
