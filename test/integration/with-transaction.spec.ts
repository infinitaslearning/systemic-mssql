import { expect } from 'chai'
import System, { Systemic } from 'systemic'

import { Book, systemicConfig } from './test-helpers'
import initDb, { Database } from '../../src'

describe('with transaction tests', () => {
  let system: Systemic<{ testDb: Database; config: typeof systemicConfig }>
  let testDb: Database

  beforeEach(async () => {
    system = System().configure(systemicConfig).add('testDb', initDb()).dependsOn('config')
    ;({ testDb } = await system.start())
  })

  afterEach(() => system.stop())

  it('commits the transaction', async () => {
    await testDb.withTransaction(async (transaction) => {
      const request = transaction.request()
      await request.query(`INSERT INTO Books (id, title) VALUES (8, 'Typescript for Dummies')`)
    })

    const queryResult = await testDb.query<Book>`SELECT * FROM Books`

    expect(queryResult.recordset).to.deep.equal([{ id: 8, title: 'Typescript for Dummies' }])
  })

  it('rolls back the transaction when an error occures', async () => {
    const error = new Error('something went wrong')
    const test = () =>
      testDb.withTransaction(async (transaction) => {
        const request = transaction.request()
        await request.query(`INSERT INTO Books (id, title) VALUES (8, 'Typescript for Dummies')`)
        throw error
      })

    await expect(test()).to.be.rejectedWith(error)

    const queryResult = await testDb.query<Book>`SELECT * FROM Books`

    expect(queryResult.recordset).to.be.empty
  })
})
