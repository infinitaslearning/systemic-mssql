import { ConnectionPool, ISOLATION_LEVEL, Transaction } from 'mssql'
import { expect } from 'chai'
import sinon from 'sinon'
import { withTransaction } from '../src/with-transaction'

describe('withTransaction tests', () => {
  it('commits after the action is completed', async () => {
    const transaction = sinon.createStubInstance(Transaction)
    sinon.stub(transaction)

    const connectionPool = sinon.createStubInstance(ConnectionPool, {
      transaction: sinon.stub<[], Transaction>().returns(transaction),
    })

    // create mock function that is the action
    const action = () => Promise.resolve()

    await withTransaction(connectionPool, action, { isolationLevel: ISOLATION_LEVEL.SERIALIZABLE })

    // make sure pool.transaction was called
    // make sure begin was called
    // action was performed
    // commit was done
    // order of begin/action/commit is correct
  })
  it('rolls back if the action throws')
  it('executes onTransactionError if the action throws')
})
