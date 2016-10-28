# Node MySQL Chassis

A promise-based API for [mysqljs](https://github.com/mysqljs/mysql) (formerly called `node-mysql`). It also provides additional functionality including `.insert()`, `.update()`, `.delete()`, and `.where()` methods to create SQL statements along with middleware to capabilities to allow custom functionality.

[![Build Status](https://travis-ci.org/bradwestfall/node-mysql-chassis.svg?branch=master)](https://travis-ci.org/bradwestfall/node-mysql-chassis)

## Install

```
npm install --save mysql-chassis
```

## Connect

```js
import MySQL from 'mysql-chassis';

const db = new MySQL({
  database: 'databasename',
  user: 'username'
});
```

> Note that if you don't provide `password` or `host` options, MySQL Chassis will pass `password: ''` and `mysqljs` will provide `host: 'localhost'` by default.

The options passed into MySQL Chassis will be passed directly to the `mysqljs` [createConnection()](https://github.com/mysqljs/mysql#introduction) method. The `db` instance returned gives you access to the MySQLChassis API. It also has `mysqljs`'s `connection` as an attribute:

```js
// mysqljs's connection API
db.connection
```

`mysqljs` has an extensive API which you'll still have access to via the `db.connection` object. See more details at [their documentation](https://github.com/mysqljs/mysql#introduction)


### MySQL Chassis Connection Options

Aside from the connection options required for `mysqljs`, you can also pass in these additional options for MySQL Chassis:

- `sqlPath`: A filepath where SQL files can be found. This is used by `selectFile()` and `queryFile()`. If no value is passed, it defaults to `./sql`
- `transforms`: An object for transform settings. See [Transforms](#transforms) below

To see a full list of other options that `mysqljs` can use, [see their documentation](https://github.com/mysqljs/mysql#connection-options)

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

export default db
```

This assumes you have `process.env` setup to be different depending on production vs development. Also, this will allow you to place your SQL files in an `sql` folder at the project root. Adjust as needed.

See the `.queryFile()` method below for an example of how to use SQL statements as files instead of inline strings.


## Results

All query execution methods return a promise with the results of the SQL:

```js
db.query('SELECT * FROM user').then(function(results) {
  console.log(results)
}).catch(function(error) {
  console.log(error)
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
db.query('SELECT * FROM user').then(function(result) {
  console.log(result.rows)
})
```

If you need to pass dynamic values into your query, use the `bindValues` option which will properly escape the values with `mysqljs`'s `connection.escape()` method.

```js
let bindValues = {id: 1}
db.query('SELECT * FROM user WHERE user_id = :id', bindValues)
```

When you use the `bindValues` option, you'll also use placeholders in your SQL (such as `:id`) to map where the values should be placed.


<hr>

### db.queryFile(filename, [bindValues])

Works just like `query()` except it allows you to pass a filename instead of SQL directly. The filename will be appended to your `sqlPath` settings (configured at the time of connection, [see above](#connect))

As an example:

```js
let bindValues = {id: 1}
db.queryFile('somefile', bindValues)
```

This assumes `somefile.sql` exists in the `sqlPath` folder and looks like this:

```sql
SELECT * FROM user WHERE user_id = :id
```

If the file exists, `.queryFile()` will behave exactly like `.query()`

Also, if you want to organize your SQL files into sub folders of the `sqlPath`, you can access those files as:

```js
let bindValues = {id: 1}
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
db.select('SELECT * FROM user').then(function(rows) {
  console.log(rows)
})

db.query('SELECT * FROM user').then(function(results) {
  console.log(results.rows)
})
```

<hr>

### db.selectFile(filename, [bindValues])

Works just like `.queryFile()` in the sense that you can pass a filename in, but works like `.select()` in the sense of how it returns `rows` instead of `results`.

<hr>

### db.insert(tableName, insertValues)

This method will write your `INSERT` statement for you and then return the results of `.query()`. Here's how we can execute an `INSERT` statement for a user with `name` and `email` fields:

```js
let insertValues = {name: 'Brad', email: 'brad@foobar.com'};

db.insert('user', insertValues).then(function(results) {
  console.log(results.insertId)
});
```

The `INSERT` statement executed would be:

```sql
INSERT INTO user
SET `name` = 'Brad', `email` = 'brad@foobar.com'
```

<hr>

### db.update(tableName, updateValues, whereClause)

This method will write your `UPDATE` statement for you and then return the results of `.query()`. Here's how we can execute an `UPDATE` statement for a user to update `name` and `email` fields:

```js
let updateValues = {name: 'Brad', email: 'brad@foobar.com'};
let whereClause = {user_id: 1, active: true};

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

### db.delete(tableName, whereClause)

This method will write your `DELETE` statement for you and returns the same promise as `query()`.

```js
let  whereClause = {user_id: 1, active: true};

db.delete('user', whereClause).then(function(results) {
  console.log(results.affectedRows)
});
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
db.update('user', updateValues, 'WHERE user.datetime_added < NOW()')
```

<hr>

## Middleware

For custom functionality, you can add middleware to be ran before or after queries are executed:

```js
db.onBeforeQuery(function(sql, bindValues) {
  // Here you can modify the SQL before it is ran
  return sql;
});

db.onResults(function(sql, results) {
  // Here you can modify the results before they are returned
  return results;
});
```

### Middleware Examples

__Example 1__: `mysqljs` always returns an array of rows regardless of how many rows are returned. But if you wanted to modify the results such that when the `SELECT` statement has a `LIMIT 1` at the end, then it will just return an object for the one row, then this is how that could be done:

```js
db.onResults(function(sql, results) {
  if (results.length !== 1) return results;
  return /^SELECT\s(.|\n)+LIMIT 1$/g.test(sql.trim()) ? results[0] : results;
});
```

__Example 2__: If you feel inclined to treat your SQL files as templates which can be dynamic depending on the `bindValues`, you can use middleware with [ejs templates](https://github.com/mde/ejs)

```js
db.onBeforeQuery(function(sql, bindValues) {
  sql = ejs.compile(sql)(bindValues);
  return sql;
});
```

Now, imagine your SQL statements can be written as follows:

```sql
# file.sql
SELECT *
FROM user
WHERE user_id = :id
<% if (active) { %>
  AND active = true
<% } %>
```

Running this command will now be able to determine if the SQL statement runs with the `AND active = true` part or not:

```js
db.select('file', {id: 1, active: true})
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
}
```

As an example, let's say we pass `undefined` or an empty string into our `.insert()` method:

```js
db.insert('user', {name: '', email: undefined});
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
