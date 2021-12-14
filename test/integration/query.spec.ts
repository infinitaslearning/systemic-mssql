import { expect } from 'chai'
import System, { Systemic } from 'systemic'

import { addBooks, Book, generateBooks, systemicConfig } from './test-helpers'
import initDb, { Database, sql } from '../../src'

describe('query tests', () => {
  let system: Systemic<{ testDb: Database; config: typeof systemicConfig }>
  let testDb: Database

  beforeEach(async () => {
    system = System().configure(systemicConfig).add('testDb', initDb()).dependsOn('config')
    ;({ testDb } = await system.start())
  })

  afterEach(() => system.stop())

  it('it queries the database', async () => {
    const books = [
      { id: 1, title: 'Test' },
      { id: 2, title: 'Test2' },
    ]
    await addBooks(books)

    const result = await testDb.query<Book>`SELECT * FROM Books`

    expect(result.recordset).to.deep.equal([
      { id: 1, title: 'Test1' },
      { id: 2, title: 'Test2' },
    ])
  })

  it('streams the query', async () => {
    const books = generateBooks(1200)
    await addBooks(books)

    const query = sql`SELECT * FROM Books`

    for await (const book of testDb.streamingQuery<Book>(query, { size: 100 })) {
      const index = books.findIndex((b) => b.id === book.id && b.title === book.title)
      expect(index).to.be.greaterThanOrEqual(0)

      books.splice(index, 1)
    }

    expect(books.length).to.be.equal(0)
  })
})
