import db from './connect'

const bindValues = { id: 1 }

// db.selectFile('select-users', bindValues).then(row => {
//   console.log(row)
// }).catch(err => console.error(err))

db.selectWhere('first_name', 'user', { user_id: 1, active: true })
  .then(results => {
    console.log(results)
  })
