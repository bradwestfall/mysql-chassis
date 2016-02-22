# Node MySQL Chassis

An promise-based API for [node-mysql](https://github.com/felixge/node-mysql) which also provides additional functionality and SQL creation methods

## Install

```
npm install --save mysql-chassis
```

## Connect

```js
var MySQLChassis = require('mysql-chassis');

// The host default is "localhost" and the password default is an empty string
const db = new MySQLChassis({
    database: 'databasename',
    user: 'username'
});
```

The options passed into `MySQLChassis` will be passed directly to `node-mysql`'s `createConnection()` method. The `db` instance offers you access to that [connection via it's `connection` property:](https://github.com/felixge/node-mysql#introduction)

```js
// node-mysql's connection data
db.connection
```

### MySQL Chassis Connection Options

The following connection options are in addition to anything `node-mysql` allows you to pass in:

- `sqlPath`: A filepath where SQL files can be found. This is used by `selectFile()` and `queryFile()`. If no value is passed, it defaults to `./sql`
- `transforms`: An object for transform settings. See [Transforms](#transforms) below
- `password`: While this is required by `node-mysql`, if not provided, a default of an empty string will be passed into `node-mysql` for you
- `limitResults`: Defaulted to `false`, this feature allows `SELECT` statements with `LIMIT 1` at the end to return only an object instead of an array with one object. [See more details](#limitresults)

## Results

When a query is executed, a results object is returned from a promise. For example:

```js
db.query('SELECT * FROM user')
  .then(function(results) {
    console.log(results)
  })
  .catch(function(error) {
    console.log(error)
  })
```

The results object will contain the following properties:

- `affectedRows`: Populated for certain queries, like `DELETE`
- `insertId`: Populated for certain queries, like `INSERT`
- `changedRows`: Populated for certain queries, like `UPDATE`
- `rows`: Populated for certain queries, like `SELECT`
- `sql`: The SQL which was executed
- `fields`: Field data as provided by `node-mysql`
- `fieldCount`: Field Count data as provided by `node-mysql`

For an error, the error object will contain the following properties:

- `err`: The error provided by `node-mysql`
- `sql`: The SQL which was executed


## Methods

### query()

- query(_string_ __sql__, [_object_ __values__])

`query()` can be used to execute any type of SQL. It returns a `result` object from a promise (See above). Chances are, you will want access to the `rows` property if the SQl was a `SELECT` statement:

```js
db.query('SELECT * FROM user').then(function(result) {
    console.log(result.rows)
})
```

When you pass in a `values` object, it will be used to bind values to your SQL where `:name` placeholders are used.

```js
var bindValues = {id: 1}
db.query('SELECT * FROM user WHERE user_id = :id')
```

Values will be escaped using `node-mysql`'s `escape()` method.

<hr>

### queryFile()

- queryFile(_string_ __filename__, [_object_ __values__])

Works just like `query()` except it allows you to pass a filename instead of an SQL string. The filename will be appended to your `sqlPath` settings (configured at the time of connection, [see above](#connect))

Note that the filename can written with or without the `.sql` extension. If no extension is provided, then `.sql` will be added to your filename.

<hr>

### select()

- select(_string_ __sql__, [_object_ __values__])

Works just like `query()` except it will return the `rows` from the promise instead of the whole `result`. Use `select()` if you only care about the `rows` being returned and want a shorter property chain to deal with.

These two things are exactly the same:

```js
db.select('SELECT * FROM user').then(function(rows) {
    console.log(rows)
})

db.query('SELECT * FROM user').then(function(results) {
    console.log(results.rows)
})
```

<hr>

### selectFile()

- selectFile(_string_ __filename__, [_object_ __values__])

Works just like `queryFile()` in the sense that you can pass a filename in, but works like `select()` in the sense of how it returns `rows` instead of `results`.

<hr>

### insert()

- insert(_string_ __tableName__, _object_ __insertValues__)

This method will write your `INSERT` statement for you and returns the same promise as `query()`. 

The example assumes database columns: `name` and `email`

```js
var insertValues = {name: 'Brad', email: 'brad@foobar.com'};
db.insert('user', insertValues).then(function(results) {
  console.log(results.insertId)
})
```

The `INSERT` statement created from the arguments above will be:

```sql
INSERT INTO user
SET `name` = 'Brad', `email` = 'brad@foobar.com'
```

<hr>

### update()

- update(_string_ __tableName__, _object_ __updateValues__, _mixed_ __whereValues__)

This method will write your `UPDATE` statement for you and returns the same promise as `query()`. 

The example assumes database columns: `name` and `email`

```js
var updateValues = {name: 'Brad', email: 'brad@foobar.com'};
var whereValues = {user_id: 1, active: true}
db.update('user', updateValues, whereValues).then(function(results) {
  console.log(results.changedRows)
})
```

The `UPDATE` statement created from the arguments above will be:

```sql
UPDATE user
SET `name` = 'Brad', `email` = 'brad@foobar.com'
WHERE `user_id` = 1
AND `active` = true
```

See more on [whereValues](#where) below

<hr>

### delete()

- delete(_string_ __tableName__, _mixed_ __whereValues__)

This method will write your `DELETE` statement for you and returns the same promise as `query()`. 

```js
var whereValues = {user_id: 1, active: true}
db.delete('user', whereValues).then(function(results) {
  console.log(results.affectedRows)
})
```

The `DELETE` statement created from the arguments above will be:

```sql
DELETE FROM user
WHERE `user_id` = 1
AND `active` = true
```

See more on [whereValues](#where) below

<hr>

### where()

- where(_mixed_ __whereValues__)

This method will take an object or a string and will create a `WHERE` clause.

If an object is passed in, it's properties and values will be turned into a `WHERE`-clause as follows:

```js
console.log(db.where({
    user_id: 1
    active: true 
})) // outputs: WHERE `user_id` = 1 AND `active` = true
```

Values will be escaped using `node-mysql`'s `escape()` method.

If a string is passed in, the string will be returned without changes. This is because other methods like `update()` and `delete` call the `where()` method and if you wanted a customized `WHERE`-clause for your `update()` method, you could do this:

```js
db.update('user', updateValues, 'WHERE user.datetime_added < NOW()')
```

<hr>

## Misc

### transforms

- Coming Soon

### limitResults

- Coming Soon