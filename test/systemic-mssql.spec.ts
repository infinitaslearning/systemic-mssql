import { expect } from 'chai'
import mssql, { ConnectionPool, Request } from 'mssql'
import sinon from 'sinon'
import { sql } from '../src/sql'

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
