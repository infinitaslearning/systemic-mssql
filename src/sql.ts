import { SqlQuery } from './systemic-mssql.types'

/**
 * Helper function to write a typed reusable sql query
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql = <TResult = unknown>(query: TemplateStringsArray, ...args: any[]): SqlQuery<TResult> => ({
  query,
  args,
})
