import { after, before } from 'mocha'
import sql, { ConnectionPool } from 'mssql'

import { dbConfig, removeAllBooks } from './test-helpers'

let pool: ConnectionPool

before(async () => {
  const { database, ...config } = dbConfig
  pool = await sql.connect(config)
  const request = pool.request()
  await request.batch(`
  IF EXISTS(SELECT * FROM sys.databases WHERE name = '${database}')
  BEGIN
    DROP DATABASE TestDb
  END`)
  await request.batch(`CREATE DATABASE ${database}`)
  await request.batch(`USE ${database}`)
  await request.batch('CREATE TABLE Books (id int, title varchar(100))')
})

beforeEach(removeAllBooks)

after(async () => {
  const request = pool.request()
  await request.batch('USE master')
  await request.batch(`DROP DATABASE ${dbConfig.database}`)
  pool.close()
})
