import { ConnectionPool, ISOLATION_LEVEL, Transaction } from 'mssql'
import { expect } from 'chai'
import sinon from 'sinon'
import { withTransaction } from '../src/with-transaction'

describe('withTransaction tests', () => {
  it.only('commits after the action is completed', async () => {
    const transaction = sinon.createStubInstance(Transaction)
    const connectionPool = sinon.createStubInstance(ConnectionPool, {
        transaction: sinon.stub<[], Transaction>().returns(transaction),
      })
    const action = sinon.stub().resolves()
    await withTransaction(connectionPool, action)

    expect(connectionPool.transaction.called).to.be.true
    expect(connectionPool.transaction.calledBefore(transaction.begin)).to.be.true
    expect(transaction.begin.called).to.be.true
    expect(transaction.begin.calledBefore(action)).to.be.true
    expect(action.called).to.be.true
  })
  it('rolls back if the action throws')
  it('executes onTransactionError if the action throws')
})
