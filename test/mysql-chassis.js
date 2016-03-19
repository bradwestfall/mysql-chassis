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

    it('should have a query method', () => {
      expect(mysql.query).to.exist
    })

    it('should have a queryFile method', () => {
      expect(mysql.queryFile).to.exist
    })

    it('should have a queryFormat method', () => {
      expect(mysql.queryFormat).to.exist
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

  describe('queryFormat method', () => {
    const mysql = new MySql()
    it('should allow named parameter binding with `:`', () => {
      expect(mysql.queryFormat('SELECT :fields FROM :table WHERE :field = :value', {
        fields: 'name,date',
        table: 'user',
        field: 'id',
        value: 1
      })).to.equal(`SELECT 'name,date' FROM 'user' WHERE 'id' = 1`)
    })

    it('should allow named parameter binding with `:` in multiline queries', () => {
      expect(mysql.queryFormat(`SELECT :fields FROM :table
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

  describe('use method', () => {
    const mysql = new MySql()
    const middleware = function() {}

    mysql.use('ON_BEFORE_QUERY', middleware)

    it('should create middleware for ON_BEFORE_QUERY', () => {
      expect(mysql.middleware.ON_BEFORE_QUERY[0]).to.equal(middleware)
    })

    mysql.use('ON_RESULTS', middleware)

    it('should create a middleare for ON_RESULTS', () => {
      expect(mysql.middleware.ON_RESULTS[0]).to.equal(middleware)
    })

    // Middleware should be a function
    mysql.use('ON_RESULTS', null)

    it('should not create middlware', () => {
      expect(mysql.middleware.ON_RESULTS[1]).to.be.undefinded
    })

  })

  describe('applyMiddleware method', () => {
    const mysql = new MySql()

    const middleware = args => args
    mysql.use('ON_BEFORE_QUERY', middleware)

    it('should apply the middlware correctly', () => {
      expect(mysql.applyMiddleware('ON_BEFORE_QUERY', 1, 2)).to.eql([1, 2])
    })

  })

})
