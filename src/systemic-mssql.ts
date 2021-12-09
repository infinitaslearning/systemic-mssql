import { ConnectionPool } from 'mssql'
import { Component } from 'systemic'
import { streamingQuery } from './streaming-query'
import { sql } from './sql'
import { Config, Database, SqlQuery } from './systemic-mssql.types'
import { withTransaction } from './with-transaction'

const startConnection = async (config: Config) => {
  const pool = new ConnectionPool(config.connection as string) // either config or string can be passed, but typescript doesn't allow union as input for this overload
  await pool.connect()
  return pool
}

const isSqlQuery = <TResult = unknown>(query: SqlQuery<TResult> | TemplateStringsArray): query is SqlQuery<TResult> =>
  'query' in query

  /**
   * Initializes a Systemic mssql Component
   */
export const initDb = (): Component<Database, { config: Config }> => {
  let pool: ConnectionPool

  return {
    start: async ({ config }) => {
      pool = await startConnection(config)

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query: <TEntity = any>(query: TemplateStringsArray | SqlQuery<TEntity>, ...args: any[]) => {
          if (isSqlQuery(query)) {
            return pool.query<TEntity>(query.query, ...query.args)
          }
          return pool.query<TEntity>(query, ...args)
        },
        streamingQuery: (query, ...args) => {
          if (isSqlQuery(query)) {
            const options = args[0]
            return streamingQuery(pool, query, options)
          }
          return streamingQuery(pool, sql(query, ...args))
        },
        withTransaction: (...args) => withTransaction(pool, ...args),
        request: () => {
          return pool.request()
        },
        onError: (callback: (error: Error) => void): void => {
          pool.on('error', callback)
        },
      }
    },
    stop: async () => {
      if (pool?.connected) await pool.close()
    },
  }
}
