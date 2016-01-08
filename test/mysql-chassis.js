const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const MySql = require('../dist/mysql-chassis')

describe('mysql-chassis', () => {
  describe('constructor', () => {
    let mysql = new MySql()

    it('should construct the mysql object', () => {
      expect(mysql.connection).to.exist
    })

    it('should have a select method', () => {
      expect(mysql.select).to.exist
    })

    it('should have a selectFile method', () => {
      expect(mysql.selectFile).to.exist
    })

    it('should have an insert method', () => {
      expect(mysql.insert).to.exist
    })

    it('should have an update method', () => {
      expect(mysql.update).to.exist
    })

    it('should have a delete method', () => {
      expect(mysql.delete).to.exist
    })
  })

  describe('queryFormat static method', () => {
    it('should allow named parameter binding with `:`', () => {
      expect(MySql.queryFormat('SELECT :fields FROM :table WHERE :field = :value', {
        fields: 'name,date',
        table: 'user',
        field: 'id',
        value: 1
      })).to.equal(`SELECT 'name,date' FROM 'user' WHERE 'id' = 1`)
    })

    it('should allow named parameter binding with `:` in multiline queries', () => {
      expect(MySql.queryFormat(`SELECT :fields FROM :table
        WHERE :field = :value`, {
        fields: 'name,date',
        table: 'user',
        field: 'id',
        value: 1
      })).to.equal(`SELECT 'name,date' FROM 'user'
        WHERE 'id' = 1`)
    })
  })

  describe('select method', () => {
    const mysql = new MySql()
    const query = sinon.stub()
    const sql = 'SELECT 1'

    query
      .onFirstCall().callsArgWith(1, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.select(sql)).to.eventually.eql({
        affectedRows: 0,
        changedRows: 0,
        fieldCount: 0,
        insertId: 0,
        fields: [],
        rows: [{ 1: 1 }]
      }).and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.select(sql)).to.eventually.be.rejected.and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })
  })

  describe('selectFile method', () => {
    const mysql = new MySql({ sqlPath: './test' })
    const query = sinon.stub()
    const sql = `SELECT *
FROM user`

    query
      .onFirstCall().callsArgWith(1, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.selectFile('select', { table: 'user' })).to.eventually.eql({
        affectedRows: 0,
        changedRows: 0,
        fieldCount: 0,
        insertId: 0,
        fields: [],
        rows: [{ 1: 1 }]
      }).and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.selectFile('select', { table: 'user' })).to.eventually.be.rejected.and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when file does not exist', done => {
      expect(mysql.selectFile('DOES_NOT_EXIST')).to.eventually.be.rejected.and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.not.been.called
        })
    })
  })

  describe('insert method', () => {
    const mysql = new MySql()
    const query = sinon.stub()
    const sql = 'INSERT INTO `users` SET `1` = 1'

    query
      .onFirstCall().callsArgWith(1, null, { insertId: 1 })
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.insert('users', { 1: 1 })).to.eventually.eql({ insertId: 1 }).and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.insert('users', { 1: 1 })).to.eventually.be.rejected.and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.not.been.calledWith(sql)
        })
    })
  })

  describe('update method', () => {
    const mysql = new MySql()
    const query = sinon.stub()
    const sql = 'UPDATE `users` SET `1` = 1 WHERE `1` = 1'

    query
      .onFirstCall().callsArgWith(1, null, { affectedRows: 1 })
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.update('users', { 1: 1 }, { 1: 1 })).to.eventually.eql({ affectedRows: 1 }).and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.update('users', { 1: 1 }, { 1: 1 })).to.eventually.be.rejected.and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })
  })

  describe('delete method', () => {
    const mysql = new MySql()
    const query = sinon.stub()
    sql = 'DELETE FROM `users` WHERE `1` = 1'

    query
      .onFirstCall().callsArgWith(1, null, { affectedRows: 1 })
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.delete('users', { 1: 1 })).to.eventually.eql({ affectedRows: 1 }).and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.delete('users', { 1: 1 })).to.eventually.be.rejected.and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })
  })
})
