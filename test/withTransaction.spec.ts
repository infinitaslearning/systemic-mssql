import { ConnectionPool, ISOLATION_LEVEL, Transaction } from 'mssql'
import { expect } from 'chai'
import sinon from 'sinon'
import { withTransaction } from '../src/with-transaction'

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

    expect(action).to.have.been.calledOnce
    expect(action).to.have.been.calledWith(transaction)

    expect(transaction.commit).to.have.been.calledOnce
    expect(transaction.commit).to.have.been.calledAfter(action)
  })
  it('rolls back if the action throws')
  it('executes onTransactionError if the action throws')
})
