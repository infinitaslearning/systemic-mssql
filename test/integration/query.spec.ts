import { expect } from 'chai'
import System, { Systemic } from 'systemic'

import { addBooks, Book, systemicConfig } from './test-helpers'
import initDb, { Database } from '../../src'

describe('query tests', () => {
  let system: Systemic<{ testDb: Database; config: typeof systemicConfig }>
  let testDb: Database

  beforeEach(async () => {
    system = System().configure(systemicConfig).add('testDb', initDb()).dependsOn('config')
    ;({ testDb } = await system.start())
  })

  afterEach(() => system.stop())

  it('query something', async () => {
    const books = [
      { id: 1, title: 'Test' },
      { id: 2, title: 'Test2' },
    ]
    await addBooks(books)

    const result = await testDb.query<Book>`SELECT * FROM Books`

    expect(result.recordset).to.deep.equal([
      { id: 1, title: 'Test' },
      { id: 2, title: 'Test2' },
    ])
  })
})
