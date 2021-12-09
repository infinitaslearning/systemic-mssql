import { sql } from '../src/sql'
import { expect } from 'chai'

describe('sql tests', () => {
  it('returns a sql query object', () => {
    const id = 'my id'
    const query = sql`SELECT 1 FROM table WHERE id = ${id}`

    expect(query).to.deep.equal({
      query: ['SELECT 1 FROM table WHERE id = ', ''],
      args: [id],
    })
  })
})
