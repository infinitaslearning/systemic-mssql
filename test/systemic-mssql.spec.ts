import { expect } from 'chai'
import mssql, { ConnectionPool, Request } from 'mssql'
import sinon from 'sinon'
import { sql } from '../src/sql'
import * as streamingQueryModule from '../src/streaming-query'
import * as withTransactionModule from '../src/with-transaction'

import { initDb } from '../src/systemic-mssql'

describe('systemic-mssql test', () => {
  describe('start', () => {
    it('connects to mssql', async () => {
      const connectionPool = sinon.createStubInstance(ConnectionPool)
      const poolStub = sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

      const connection = 'my connection string'
      const component = initDb()

      await component.start({ config: { connection } })

      expect(poolStub).to.have.been.calledOnceWith(connection)
      expect(connectionPool.connect).to.have.been.calledOnce
    })
  })

  describe('stop', () => {
    it('disconnects from mssql', async () => {
      const connectionPool = sinon.createStubInstance(ConnectionPool)
      sinon.stub(connectionPool, 'connected').value(true)
      sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

      const connection = 'my connection string'
      const component = initDb()

      await component.start({ config: { connection } })

      await component.stop()

      expect(connectionPool.close).to.have.been.calledOnce
      expect(connectionPool.close).to.have.been.calledAfter(connectionPool.connect)
    })

    it('does not close the pool without being started', async () => {
      const connectionPool = sinon.createStubInstance(ConnectionPool)
      const poolStub = sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

      const component = initDb()

      await component.stop()

      expect(poolStub).to.have.not.been.called
      expect(connectionPool.connect).to.have.not.been.called
      expect(connectionPool.close).to.have.not.been.called
    })
  })

  describe('query', () => {
    it('executes the query, returning its result', async () => {
      const queryResult = 'query result'
      const connectionPool = sinon.createStubInstance(ConnectionPool)
      connectionPool.query.resolves(queryResult)
      sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

      const component = initDb()
      const { query } = await component.start({ config: { connection: 'my connection string' } })

      const id = 1
      const qry = sql`SELECT * FROM dummy WHERE id = ${id}`

      const result = await query(qry)

      expect(result).to.equal(queryResult)
      expect(connectionPool.query).to.have.been.calledOnceWith(qry.query, ...qry.args)
    })

    it('executes the query string, returning its result', async () => {
      const queryResult = 'query result'
      const connectionPool = sinon.createStubInstance(ConnectionPool)
      connectionPool.query.resolves(queryResult)
      sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

      const component = initDb()
      const { query } = await component.start({ config: { connection: 'my connection string' } })

      const id = 1
      const qry = sql`SELECT * FROM dummy WHERE id = ${id}`

      const result = await query`SELECT * FROM dummy WHERE id = ${id}`

      expect(result).to.equal(queryResult)
      expect(connectionPool.query).to.have.been.calledOnceWith(qry.query, ...qry.args)
    })
  })

  describe('streamingQuery tests', () => {
    it('executes the query, streaming its result', async () => {
      const queryResult = 'query result'
      const connectionPool = sinon.createStubInstance(ConnectionPool)
      sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

      const streamingQueryStub = sinon.stub(streamingQueryModule, 'streamingQuery').resolves(queryResult)

      const component = initDb()
      const { streamingQuery } = await component.start({ config: { connection: 'my connection string' } })

      const id = 1
      const qry = sql`SELECT * FROM dummy WHERE id = ${id}`
      const options = { size: 5 }

      const result = await streamingQuery(qry, options)

      expect(result).to.equal(queryResult)
      expect(streamingQueryStub).to.have.been.calledOnceWith(connectionPool, qry, options)
    })

    it('executes the query string, streaming its result', async () => {
      const queryResult = 'query result'
      const connectionPool = sinon.createStubInstance(ConnectionPool)
      sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

      const streamingQueryStub = sinon.stub(streamingQueryModule, 'streamingQuery').resolves(queryResult)

      const component = initDb()
      const { streamingQuery } = await component.start({ config: { connection: 'my connection string' } })

      const id = 1
      const qry = sql`SELECT * FROM dummy WHERE id = ${id}`

      const result = await streamingQuery`SELECT * FROM dummy WHERE id = ${id}`

      expect(result).to.equal(queryResult)
      expect(streamingQueryStub).to.have.been.calledOnceWith(connectionPool, qry)
    })
  })

  describe('withTransaction tests', () => {
    it('executes the action with transaction', async () => {
      const connectionPool = sinon.createStubInstance(ConnectionPool)
      sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

      const action = () => null
      const isolationLevel = 5
      const onTransactionError = () => null
      const withTransactionStub = sinon.stub(withTransactionModule, 'withTransaction')

      const component = initDb()
      const { withTransaction } = await component.start({ config: { connection: 'my connection string' } })

      await withTransaction(action, { isolationLevel, onTransactionError })

      expect(withTransactionStub).to.have.been.calledOnceWith(connectionPool, action, {
        isolationLevel,
        onTransactionError,
      })
    })
  })

  describe('request', () => {
    it('returns a request from the connection pool', async () => {
      const req = sinon.createStubInstance(Request)
      const connectionPool = sinon.createStubInstance(ConnectionPool, {
        request: req,
      })
      sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

      const component = initDb()
      const { request } = await component.start({ config: { connection: 'my connection string' } })

      const result = request()

      expect(connectionPool.request).to.have.been.calledOnce
      expect(result).to.deep.equal(req)
    })
  })

  describe('onError', () => {
    it('adds a default error handler to the connection pool', async () => {
      const connectionPool = sinon.createStubInstance(ConnectionPool)
      sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

      const component = initDb()
      const { onError } = await component.start({ config: { connection: 'my connection string' } })
      const callback = 'my-callback' as unknown as () => void

      onError(callback)

      expect(connectionPool.on).to.have.been.calledOnceWith('error', callback)
    })
  })
})
