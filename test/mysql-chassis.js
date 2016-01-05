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

  describe('select method', () => {
    const mysql = new MySql()
    const query = sinon.stub()
    const sql = 'SELECT 1'

    query
      .onFirstCall().callsArgWith(2, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(2, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.select(sql)).to.eventually.eql([{ 1: 1 }]).and.notify(done)
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
    const sql = 'SELECT 1'

    query
      .onFirstCall().callsArgWith(2, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(2, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.selectFile('select')).to.eventually.eql([{ 1: 1 }]).and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.selectFile('select')).to.eventually.be.rejected.and.notify(done)
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
      expect(mysql.insert('users', { 1: 1 })).to.eventually.eql(1).and.notify(done)
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
      expect(mysql.update('users', { 1: 1 }, { 1: 1 })).to.eventually.eql(1).and.notify(done)
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
      .onFirstCall().callsArgWith(1, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.delete('users', { 1: 1 })).to.eventually.eql([{ 1: 1 }]).and.notify(done)
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
