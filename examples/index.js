var MySql = require('../dist/mysql-chassis')

mysql = new MySql({
    database: 'mysql-chassis',
    user: 'root',
    password: '',
    sqlPath: './api/sql',
    transforms: {
      undefined: 'NULL',
      '': 'NULL',
      'NOW()': 'NOW()'
    }
})

var values = {first_name: 'Brad', datetime_added: 'NOW()'}

mysql.insert('user', values).then(res => {
    console.log('res', res)
}).catch(err => {
    console.log('err', err)
})

mysql.select('SELECT * FROM user').then(res => {
    console.log(res)
})

mysql.connection.end();