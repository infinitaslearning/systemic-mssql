import { ConnectionPool, ISOLATION_LEVEL, Transaction } from 'mssql'
import { expect } from 'chai'
import sinon from 'sinon'
import { withTransaction } from '../../src/with-transaction'

describe('withTransaction tests', () => {
  it('commits after the action is completed', async () => {
    const transaction = sinon.createStubInstance(Transaction)
    const connectionPool = sinon.createStubInstance(ConnectionPool, {
      transaction: sinon.stub<[], Transaction>().returns(transaction),
    })
    const action = sinon.stub().resolves()
    await withTransaction(connectionPool, action, { isolationLevel: ISOLATION_LEVEL.SERIALIZABLE })

    expect(connectionPool.transaction).to.have.been.calledOnce
    expect(connectionPool.transaction).to.have.been.calledBefore(transaction.begin)

    expect(transaction.begin).to.have.been.calledOnceWith(ISOLATION_LEVEL.SERIALIZABLE)
    expect(transaction.begin).to.have.been.calledBefore(action)

    expect(action).to.have.been.calledOnceWith(transaction)

    expect(transaction.commit).to.have.been.calledOnce
    expect(transaction.commit).to.have.been.calledAfter(action)
  })

  it('rolls back if the action throws', async () => {
    const transaction = sinon.createStubInstance(Transaction)
    const connectionPool = sinon.createStubInstance(ConnectionPool, {
      transaction: sinon.stub<[], Transaction>().returns(transaction),
    })

    const error = new Error('my-exception')
    const action = sinon.stub().rejects(error)
    const test = async () => await withTransaction(connectionPool, action)

    await expect(test()).to.be.rejectedWith(error)

    expect(connectionPool.transaction).to.have.been.calledOnce
    expect(connectionPool.transaction).to.have.been.calledBefore(transaction.begin)

    expect(transaction.begin).to.have.been.calledOnce

    expect(action).to.have.been.calledOnceWith(transaction)
    expect(action).to.have.been.calledAfter(transaction.begin)

    expect(transaction.commit).to.have.not.been.called

    expect(transaction.rollback).to.have.been.calledOnce
    expect(transaction.rollback).to.have.been.calledAfter(action)
  })

  it('performs onTransactionError if the action throws', async () => {
    const transaction = sinon.createStubInstance(Transaction)
    const connectionPool = sinon.createStubInstance(ConnectionPool, {
      transaction: sinon.stub<[], Transaction>().returns(transaction),
    })

    const error = new Error('my-exception')
    const action = sinon.stub().rejects(error)
    const onTransactionError = sinon.stub()

    await withTransaction(connectionPool, action, { onTransactionError })

    expect(connectionPool.transaction).to.have.been.calledOnce
    expect(connectionPool.transaction).to.have.been.calledBefore(transaction.begin)

    expect(transaction.begin).to.have.been.calledOnce

    expect(action).to.have.been.calledOnceWith(transaction)
    expect(action).to.have.been.calledAfter(transaction.begin)

    expect(transaction.commit).to.have.not.been.called
    expect(onTransactionError).to.have.been.calledOnceWith(error, transaction)
  })
})
