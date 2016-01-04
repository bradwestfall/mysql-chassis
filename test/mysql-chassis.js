const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
chai.use(require('sinon-chai'))
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
      mysql.select(sql, error => {
        expect(mysql.connection.query).to.have.been.calledWith(sql)
        expect(error).to.not.exist
        done()
      })
    })

    it('should callback with error when internal query method errors', done => {
      mysql.select(sql, error => {
        expect(mysql.connection.query).to.have.been.calledWith(sql)
        expect(error).to.exist
        done()
      })
    })
  })

  describe('selectFile method', () => {
    const mysql = new MySql({ sqlPath: './test' })
    const query = sinon.stub()

    query
      .onFirstCall().callsArgWith(2, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(2, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      mysql.selectFile('select', error => {
        expect(mysql.connection.query).to.have.been.calledWith('SELECT 1')
        expect(error).to.not.exist
        done()
      })
    })

    it('should callback with error when internal query method errors', done => {
      mysql.selectFile('select', error => {
        expect(mysql.connection.query).to.have.been.calledWith('SELECT 1')
        expect(error).to.exist
        done()
      })
    })
  })

  describe('insert method', () => {
    const mysql = new MySql()
    const query = sinon.stub()

    query
      .onFirstCall().callsArgWith(1, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      mysql.insert('users', { 1: 1 }, error => {
        expect(mysql.connection.query).to.have.been.calledWith('INSERT INTO `users` SET `1` = 1')
        expect(error).to.not.exist
        done()
      })
    })

    it('should callback with error when internal query method errors', done => {
      mysql.insert('users', { 1: 1 }, error => {
        expect(mysql.connection.query).to.have.been.calledWith('INSERT INTO `users` SET `1` = 1')
        expect(error).to.exist
        done()
      })
    })
  })

  describe('update method', () => {
    const mysql = new MySql()
    const query = sinon.stub()

    query
      .onFirstCall().callsArgWith(1, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      mysql.update('users', { 1: 1 }, { 1: 1 }, error => {
        expect(mysql.connection.query).to.have.been.calledWith('UPDATE `users` SET `1` = 1 WHERE `1` = 1')
        expect(error).to.not.exist
        done()
      })
    })

    it('should callback with error when internal query method errors', done => {
      mysql.update('users', { 1: 1 }, { 1: 1 }, error => {
        expect(mysql.connection.query).to.have.been.calledWith('UPDATE `users` SET `1` = 1 WHERE `1` = 1')
        expect(error).to.exist
        done()
      })
    })
  })

  describe('delete method', () => {
    const mysql = new MySql()
    const query = sinon.stub()

    query
      .onFirstCall().callsArgWith(1, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      mysql.delete('users', { 1: 1 }, error => {
        expect(mysql.connection.query).to.have.been.calledWith('DELETE FROM `users` WHERE `1` = 1')
        expect(error).to.not.exist
        done()
      })
    })

    it('should callback with error when internal query method errors', done => {
      mysql.delete('users', { 1: 1 }, error => {
        expect(mysql.connection.query).to.have.been.calledWith('DELETE FROM `users` WHERE `1` = 1')
        expect(error).to.exist
        done()
      })
    })
  })
})
