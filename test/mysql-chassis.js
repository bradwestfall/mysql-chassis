import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import MySql from '../src/index'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)

describe('mysql-chassis', () => {
  describe('constructor', () => {
    const mysql = new MySql()

    it('should construct the mysql object', () => {
      expect(mysql.connection).to.exist
    })

    it('should have a select method', () => {
      expect(mysql.select).to.exist
    })

    it('should have a selectFile method', () => {
      expect(mysql.selectFile).to.exist
    })

    it('should have a selectWhere method', () => {
      expect(mysql.selectWhere).to.exist
    })

    it('should have an insert method', () => {
      expect(mysql.insert).to.exist
    })

    it('should have an update method', () => {
      expect(mysql.update).to.exist
    })

    it('should have an insertUpdate method', () => {
      expect(mysql.insertUpdate).to.exist
    })

    it('should have an insertIgnore method', () => {
      expect(mysql.insertIgnore).to.exist
    })

    it('should have a delete method', () => {
      expect(mysql.delete).to.exist
    })

    it('should have a query method', () => {
      expect(mysql.query).to.exist
    })

    it('should have a queryFile method', () => {
      expect(mysql.queryFile).to.exist
    })

    it('should have a getFile method', () => {
      expect(mysql.getFile).to.exist
    })

    it('should have an escape method', () => {
      expect(mysql.escape).to.exist
    })

    it('should have a queryBindValues method', () => {
      expect(mysql.queryBindValues).to.exist
    })

    it('should have a sqlWhere method', () => {
      expect(mysql.sqlWhere).to.exist
    })

    it('should have a createInsertValues method', () => {
      expect(mysql.createInsertValues).to.exist
    })

    it('should have a transformValues method', () => {
      expect(mysql.transformValues).to.exist
    })

    it('should have a onResults method', () => {
      expect(mysql.onResults).to.exist
    })

    it('should have a onBeforeQuery method', () => {
      expect(mysql.onBeforeQuery).to.exist
    })

    it('should have a applyMiddlewareOnResults method', () => {
      expect(mysql.applyMiddlewareOnResults).to.exist
    })

    it('should have a applyMiddlewareOnBeforeQuery method', () => {
      expect(mysql.applyMiddlewareOnBeforeQuery).to.exist
    })

    it('should have a beginTransaction method', () => {
      expect(mysql.beginTransaction).to.exist
    })
    it('should have a commit method', () => {
      expect(mysql.commit).to.exist
    })
    it('should have a rollback method', () => {
      expect(mysql.rollback).to.exist
    })
    it('should have a getConnection method', () => {
      expect(mysql.getConnection).to.exist
    })
    it('should have an end method', () => {
      expect(mysql.end).to.exist
    })
    it('should have an on method', () => {
      expect(mysql.on).to.exist
    })

  })

  describe('select method', () => {
    const mysql = new MySql()
    const query = sinon.stub()
    const sql = 'SELECT * FROM user WHERE user_id = :user_id'

    query
      .onFirstCall().callsArgWith(1, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.select(sql, { user_id: 1 })).to.eventually.eql([{ 1: 1 }])
        .and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith('foosdfsdf')
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

    query
      .onFirstCall().callsArgWith(1, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.selectFile('select', { user_id: 1 })).to.eventually.eql([{ 1: 1 }])
        .and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.selectFile('select', { user_id: 1 })).to.eventually.be.rejected.and.notify(done)
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



  // describe('selectWhere method', () => {

  // })



  describe('insert method', () => {
    const mysql = new MySql()

    mysql.query = function() {
      return Promise.resolve({ insertId: 1 })
    }

    it('should call internal query method', done => {
      expect(mysql.insert('table', { 1: 1 })).to.eventually.eql({ insertId: 1 }).and.notify(done)
    })

    mysql.query = function() {
      return Promise.reject()
    }

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.insert('table', { 1: 1 })).to.eventually.be.rejected.and.notify(done)
    })

  })

  describe('update method', () => {
    const mysql = new MySql()

    mysql.query = function() {
      return Promise.resolve({ changedRows: 1 })
    }

    it('should call internal query method', done => {
      expect(mysql.update('table', { 1: 1 }, { 1: 1 })).to.eventually.eql({ changedRows: 1 }).and.notify(done)
    })

    mysql.query = function() {
      return Promise.reject()
    }

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.update('table', { 1: 1 }, { 1: 1 })).to.eventually.be.rejected.and.notify(done)
    })

  })



  // describe('insertUpdate method', () => {

  // })

  // describe('insertIgnore method', () => {

  // })

  // describe('insertMultiple method', () => {

  // })



  describe('delete method', () => {
    const mysql = new MySql()

    mysql.query = function() {
      return Promise.resolve({ affectedRows: 1 })
    }

    it('should call internal query method', done => {
      expect(mysql.delete('table', { 1: 1 }, { 1: 1 })).to.eventually.eql({ affectedRows: 1 }).and.notify(done)
    })

    mysql.query = function() {
      return Promise.reject()
    }

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.delete('table', { 1: 1 }, { 1: 1 })).to.eventually.be.rejected.and.notify(done)
    })

  })

  describe('query method', () => {
    const mysql = new MySql()
    const query = sinon.stub()
    const sql = 'SELECT * FROM user WHERE user_id = :user_id'

    query
      .onFirstCall().callsArgWith(1, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.query(sql, {user_id: 1})).to.eventually.eql({
        rows: [{ 1: 1 }],
        fields: undefined,
        sql: 'SELECT * FROM user WHERE user_id = 1'
      }).and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.query(sql)).to.eventually.be.rejected.and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })
  })

  describe('queryFile method', () => {
    const mysql = new MySql({ sqlPath: './test' })
    const query = sinon.stub()

    query
      .onFirstCall().callsArgWith(1, null, [{ 1: 1 }])
      .onSecondCall().callsArgWith(1, 'TEST ERROR')

    mysql.connection = { query }

    it('should call internal query method', done => {
      expect(mysql.queryFile('select', { user_id: 1 })).to.eventually.eql({
        rows: [{ 1: 1 }],
        fields: undefined,
        sql: 'SELECT * FROM user WHERE user_id = 1'
      }).and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when internal query method errors', done => {
      expect(mysql.queryFile('select', { table: 'user' })).to.eventually.be.rejected.and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.been.calledWith(sql)
        })
    })

    it('should reject promise with error when file does not exist', done => {
      expect(mysql.queryFile('DOES_NOT_EXIST')).to.eventually.be.rejected.and.notify(done)
        .then(() => {
          expect(mysql.connection.query).to.have.not.been.called
        })
    })
  })


  // describe('getFile method', () => {

  // })

  // describe('escape method', () => {

  // })

  describe('transaction methods', () => {
    const mysql = new MySql()
    const transactionStatus = {
      affectedRows: 0,
      warningCount: 0,
      serverStatus: 3 // SERVER_STATUS_IN_TRANS
    }
    const autoCommitStatus = {
      ...transactionStatus,
      serverStatus: 2 // SERVER_STATUS_AUTOCOMMIT
    }

    it('should call internal beginTransaction method', sinon.test(done => {
      const beginTransaction = sinon.stub(mysql.connection, 'beginTransaction')
      beginTransaction.onFirstCall().callsArgWith(0, null, transactionStatus)

      expect(mysql.beginTransaction()).to.eventually.eql(transactionStatus)
        .then(() => {
          sinon.assert.calledOnce(beginTransaction);
          done()
        })
        .catch(err => done(err))
    }))

    it('should call internal commit method', sinon.test(done => {
      const commit = sinon.stub(mysql.connection, 'commit')
      commit.onFirstCall().callsArgWith(0, null, transactionStatus)

      expect(mysql.commit()).to.eventually.eql(transactionStatus)
        .then(() => {
          sinon.assert.calledOnce(commit);
          done()
        })
        .catch(err => done(err))
    }))

    it('should call internal rollback method', sinon.test(done => {
      const rollback = sinon.stub(mysql.connection, 'rollback')
      rollback.onFirstCall().callsArgWith(0, null, autoCommitStatus)

      expect(mysql.rollback()).to.eventually.eql(autoCommitStatus)
        .then(() => {
          sinon.assert.calledOnce(rollback);
          done()
        })
        .catch(err => done(err))
    }))
  })

  describe('pool methods', () => {
    const options = {
      connectionLimit: 5
    }
    const mysql = new MySql(options)

    it('should call internal getConnection method', sinon.test(() => {
      const getConnection = sinon.spy(mysql.connection, 'getConnection')

      mysql.getConnection(() => {})
      sinon.assert.calledOnce(getConnection)
    }))

    it('should expose pool connection', () => {
      expect(mysql.connection.config.connectionLimit).to.eql(options.connectionLimit)
    })
  })

  describe('queryBindValues method', () => {
    const mysql = new MySql()
    it('should allow named parameter binding with `:`', () => {
      expect(mysql.queryBindValues('SELECT :fields FROM :table WHERE :field = :value', {
        fields: 'name,date',
        table: 'user',
        field: 'id',
        value: 1
      })).to.equal(`SELECT 'name,date' FROM 'user' WHERE 'id' = 1`)
    })

    it('should allow named parameter binding with `:` in multiline queries', () => {
      expect(mysql.queryBindValues(`SELECT :fields FROM :table
        WHERE :field = :value`, {
        fields: 'name,date',
        table: 'user',
        field: 'id',
        value: 1
      })).to.equal(`SELECT 'name,date' FROM 'user'
        WHERE 'id' = 1`)
    })
  })

  describe('createInsertValues method', () => {
    const mysql = new MySql()

    it('should create values string', () => {
      expect(mysql.createInsertValues({
        fields: 'name,date',
        table: undefined,
        field: 'id',
        value: 1
      })).to.equal("`fields` = 'name,date',`table` = NULL,`field` = 'id',`value` = 1")
    })
  })

  describe('transformValues method', () => {
    const mysql = new MySql({
      transforms: {
        undefined: 'NULL',
        '': 'NULL',
        user: v => `'${v.toUpperCase()}'`
      }
    })

    it('should transform values according to options (String)', () => {
      expect(mysql.transformValues({
        fields: 'name,date',
        table: 'log',
        field: 'id',
        value: ''
      })).to.eql({
        fields: "'name,date'",
        table: "'log'",
        field: "'id'",
        value: 'NULL'
      })
    })

    it('should transform values according to options (Function)', () => {
      expect(mysql.transformValues({
        fields: 'name,date',
        table: 'user'
      })).to.eql({
        fields: "'name,date'",
        table: "'USER'"
      })
    })
  })

  describe('onResults method', () => {
    const mysql = new MySql()
    const middleware = function() {}

    mysql.onResults(middleware)

    it('should create middleware for onResults', () => {
      expect(mysql.middleware.onResults[0]).to.equal(middleware)
    })

    // Middleware should be a function
    mysql.onResults('not a function')

    it('should not create middlware', () => {
      expect(mysql.middleware.onResults[1]).to.be.undefinded
    })

  })

  describe('onBeforeQuery method', () => {
    const mysql = new MySql()
    const middleware = function() {}

    mysql.onBeforeQuery(middleware)

    it('should create middleware for onBeforeQuery', () => {
      expect(mysql.middleware.onBeforeQuery[0]).to.equal(middleware)
    })

    // Middleware should be a function
    mysql.onBeforeQuery('not a function')

    it('should not create middlware', () => {
      expect(mysql.middleware.onBeforeQuery[1]).to.be.undefinded
    })

  })

  describe('applyMiddlewareOnResults method', () => {
    const mysql = new MySql()

    mysql.onResults((sql, results) => {
      return (sql === 'ADD_ONE') ? ++results : results
    })

    it('should apply the onResults middleware correctly', () => {
      expect(mysql.applyMiddlewareOnResults('ADD_ONE', 1)).to.equal(2)
    })

    it('should not apply the onResults middleware correctly', () => {
      expect(mysql.applyMiddlewareOnResults('DO NOTHING', 1)).to.equal(1)
    })

  })

  describe('applyMiddlewareOnBeforeQuery method', () => {
    const mysql = new MySql()

    mysql.onBeforeQuery((sql, values) => {
      return (sql === 'ADD_ONE') ? ++values : values
    })

    it('should apply the onBeforeQuery middleware correctly', () => {
      expect(mysql.applyMiddlewareOnBeforeQuery('ADD_ONE', 1)).to.equal(2)
    })

    it('should not apply the onBeforeQuery middleware correctly', () => {
      expect(mysql.applyMiddlewareOnBeforeQuery('DO NOTHING', 1)).to.equal(1)
    })

  })

})
