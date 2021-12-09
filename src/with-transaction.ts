import { ConnectionPool, IIsolationLevel, Transaction } from 'mssql'

export const withTransaction = async (
  pool: ConnectionPool,
  action: (transaction: Transaction) => Promise<void>,
  {
    isolationLevel,
    onError,
  }: {
    isolationLevel?: IIsolationLevel
    onError?: (error: Error) => Promise<void> | void
  } = {},
) => {
  const transaction = pool.transaction()
  await transaction.begin(isolationLevel)

  try {
    await action(transaction)
    await transaction.commit()
  } catch (err) {
    if (onError) {
      await onError(err as Error)
    } else {
      await transaction.rollback()
      throw err
    }
  }
}
