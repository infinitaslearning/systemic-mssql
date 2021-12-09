import { ConnectionPool } from 'mssql'
import { SqlQuery } from './systemic-mssql.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const streamingQuery = async function* <TEntity = any>(
  pool: ConnectionPool,
  query: SqlQuery<TEntity>,
  { size = 1000 }: { size?: number } = {},
): AsyncGenerator<TEntity, void, undefined> {
  const request = pool.request()
  request.stream = true

  let resolve: () => void
  let promise = new Promise<void>((accept) => (resolve = accept))
  let done = false
  let results: TEntity[] = []

  request.on('error', (err) => {
    throw err
  })
  request.on('row', (row) => {
    results.push(row)
    if (results.length >= size) {
      request.pause()
    }

    resolve()
    promise = new Promise((accept) => (resolve = accept))
  })
  request.on('done', () => {
    done = true
    resolve()
  })
  request.query<TEntity>(query.query, ...query.args)

  while (!done) {
    await promise
    yield* results
    results = []
    request.resume()
  }
}
