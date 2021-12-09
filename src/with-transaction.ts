import { ConnectionPool, IIsolationLevel, Transaction } from 'mssql'

export const withTransaction = async (
  pool: ConnectionPool,
  action: (transaction: Transaction) => Promise<void>,
  {
    isolationLevel,
    onTransactionError = async (error, transaction) => {
      await transaction.rollback()
      throw error
    },
  }: {
    isolationLevel?: IIsolationLevel
    onTransactionError?: (error: Error, transaction: Transaction) => Promise<void> | void
  } = {},
) => {
  const transaction = pool.transaction()
  await transaction.begin(isolationLevel)

  try {
    await action(transaction)
    await transaction.commit()
  } catch (err) {
    onTransactionError(err as Error, transaction)
  }
}
