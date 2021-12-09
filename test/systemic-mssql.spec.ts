import { expect } from 'chai'
import mssql, { ConnectionPool } from 'mssql'
import sinon from 'sinon'

import { initDb } from '../src/systemic-mssql'

describe('systemic-mssql test', () => {
  it('connects to mssql when starting', async () => {
    const connectionPool = sinon.createStubInstance(ConnectionPool)
    const poolStub = sinon.stub(mssql, 'ConnectionPool').returns(connectionPool)

    const connection = 'my connection string'
    const component = initDb()

    await component.start({ config: { connection } })

    expect(poolStub).to.have.been.calledOnceWith(connection)
    expect(connectionPool.connect).to.have.been.calledOnce
  })

  it('disconnects from mssql when stopping', async () => {
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
