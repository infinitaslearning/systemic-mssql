import sql, { config } from 'mssql'

export type Book = {
  id: number
  title: string
}

export const dbConfig: config = {
  server: 'localhost',
  user: 'sa',
  password: 'GxtjDzMhN_q2K2AKDPAuaNLds',
  options: { trustServerCertificate: true },
  database: 'TestDb',
}

export const systemicConfig = { testDb: { connection: dbConfig } }

export const addBooks = (books: Book[]) => {
  const table = new sql.Table('Books')
  table.columns.add('id', sql.Int, { primary: true })
  table.columns.add('title', sql.VarChar(100))

  books.forEach(({ id, title }) => table.rows.add(id, title))

  const request = new sql.Request()
  return request.bulk(table)
}

export const generateBooks = (count: number) => {
  return new Array(count).fill(0).map((_, index) => ({ id: index, title: `Book ${index}` }))
}

export const removeAllBooks = () => {
  const request = new sql.Request()
  return request.batch('TRUNCATE TABLE Books')
}
