import db from './connect'

const insertValues = { first_name: 'Brad', last_name: 'Westfall', datetime_added: 'NOW()' }

Promise.resolve()
  .then(db.beginTransaction)
  .then(() => db.insertIgnore('user', insertValues))
  .then(response => {
    console.log('INSERT Response:', response)
    return response.insertId
  })
  .then(insertId => {
    console.log('insertId', insertId)
    return insertId
  })
  .then(insertId => db.update('user', { first_name: 'Brad-edited' }, { user_id: insertId }))
  .then(db.commit)
  .then(() => console.log('success'))
  .catch(err => {
    console.error(err)
    db.rollback()
  })
