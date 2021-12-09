/* eslint-disable @typescript-eslint/no-explicit-any */
import { config, IIsolationLevel, IResult, Transaction, Request } from 'mssql'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SqlQuery<TResult> = {
  query: TemplateStringsArray
  args: any[]
}

/**
 * Connects to a MS Sql Server database instance
 */
export type Database = {
  /**
   * Query the database
   * @returns A promise for a query result
   */
  query<TEntity = any>(strings: TemplateStringsArray, ...interpolations: any[]): Promise<IResult<TEntity>>
  query<TEntity = any>(query: SqlQuery<TEntity>): Promise<IResult<TEntity>>

  /**
   * Query the database and have the database stream the result to the server, to prevent memory overload when receiving a large result set.
   * @param options Set the size to change the maximum number of records that will be cached, defaults to 1000
   * @returns An async iterable iterator yielding the result one row at a time.
   */
  streamingQuery<TEntity = any>(query: SqlQuery<TEntity>, options: { size?: number }): AsyncIterableIterator<TEntity>
  streamingQuery<TEntity = any>(strings: TemplateStringsArray, ...interpolations: any[]): AsyncIterableIterator<TEntity>

  /**
   * All requests made on the transaction will be automatically commit on success, or rolled back when an error occures
   */
  withTransaction: (
    action: (transaction: Transaction) => Promise<void>,
    options?: {
      isolationLevel?: IIsolationLevel
      onError?: (error: Error) => Promise<void> | void
    },
  ) => Promise<void>

  /**
   * Gives direct access to a Request, on which any actions towards the database can be performed
   */
  request: () => Request

  /**
   * Attach main error callback to the connection pool
   */
  onError: (callback: (error: Error) => void) => void
}

export type Config = {
  connection: config | string
}
