import db from './connect'

const insertValues = { first_name: 'Brad', last_name: 'Westfall', datetime_added: 'NOW()' }

db.insertIgnore('user', insertValues).then(response => {
  console.log('INSERT Response:', response)
}).catch(err => {
  console.error(err)
})
