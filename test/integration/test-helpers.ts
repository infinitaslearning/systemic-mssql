import sql, { config } from 'mssql'

export type Book = {
  id: number
  title: string
}

export const dbConfig: config = {
  server: 'localhost',
  user: 'sa',
  password: '$KCM_qJ2eWCYcho4.nV-V@_D',
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

export const removeAllBooks = () => {
  const request = new sql.Request()
  return request.batch('TRUNCATE TABLE Books')
}
