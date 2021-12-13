/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai'
import { ConnectionPool, Request } from 'mssql'
import sinon from 'sinon'
import { sql } from '../../src/sql'
import { streamingQuery } from '../../src/streaming-query'

const getEvents = (
  request: sinon.SinonStubbedInstance<Request>,
): { error: (err: any) => void; row: (row: any) => void; done: () => void } => {
  const calls = request.on.getCalls()

  expect(request.on).to.have.been.calledThrice

  const error = calls.find((call) => call.args[0] === 'error')!.args[1]
  const row = calls.find((call) => call.args[0] === 'row')!.args[1]
  const done = calls.find((call) => call.args[0] === 'done')!.args[1]
  return {
    error,
    row,
    done,
  }
}

const sleep = () => new Promise<void>((resolve) => setTimeout(resolve, 5))

describe('streaming query tests', () => {
  it('is done when request signals "done"', async () => {
    const connectionPool = sinon.createStubInstance(ConnectionPool)
    const request = sinon.createStubInstance(Request)
    connectionPool.request.returns(request)

    const query = sql<{ id: number }>`SELECT * FROM myBigTable`

    const iterator = streamingQuery(connectionPool, query)
    const initialResultPromise = iterator.next()
    const { done } = getEvents(request)

    done()
    const result = await initialResultPromise

    expect(result.done).to.be.true
  })

  it('yields the query result', async () => {
    const connectionPool = sinon.createStubInstance(ConnectionPool)
    const request = sinon.createStubInstance(Request)
    connectionPool.request.returns(request)

    const query = sql<{ id: number }>`SELECT * FROM myBigTable`

    const iterator = streamingQuery(connectionPool, query)
    const initialResultPromise = iterator.next()
    const { row, done } = getEvents(request)

    row({ id: 5 })
    row({ id: 4 })
    row({ id: 7 })
    done()

    expect(request.stream).to.be.true
    expect(await initialResultPromise).to.deep.equal({ value: { id: 5 }, done: false })
    expect(await iterator.next()).to.deep.equal({ value: { id: 4 }, done: false })
    expect(await iterator.next()).to.deep.equal({ value: { id: 7 }, done: false })
    expect(await iterator.next()).to.deep.equal({ value: undefined, done: true })
    expect(request.pause).to.have.not.been.called
  })

  it('pauses the request when buffer is full', async () => {
    const connectionPool = sinon.createStubInstance(ConnectionPool)
    const request = sinon.createStubInstance(Request)
    connectionPool.request.returns(request)

    const query = sql<{ id: number }>`SELECT * FROM myBigTable`

    const iterator = streamingQuery(connectionPool, query, { size: 2 })
    const initialResultPromise = iterator.next()
    const { row, done } = getEvents(request)

    row({ id: 5 })
    expect(request.pause).to.not.have.been.called
    row({ id: 4 })
    expect(request.pause).to.have.been.calledOnce

    expect(await initialResultPromise).to.deep.equal({ value: { id: 5 }, done: false })

    expect(await iterator.next()).to.deep.equal({ value: { id: 4 }, done: false })
    expect(request.resume).to.not.have.been.called

    const nextBatchResultPromise = iterator.next()
    await sleep()
    expect(request.resume).to.have.been.calledOnce

    row({ id: 7 })
    done()

    expect(await nextBatchResultPromise).to.deep.equal({ value: { id: 7 }, done: false })
    expect(await iterator.next()).to.deep.equal({ value: undefined, done: true })
  })

  it('throws when an error occures in streaming the result', async () => {
    const connectionPool = sinon.createStubInstance(ConnectionPool)
    const request = sinon.createStubInstance(Request)
    connectionPool.request.returns(request)

    const query = sql<{ id: number }>`SELECT * FROM myBigTable`

    const iterator = streamingQuery(connectionPool, query, { size: 2 })
    iterator.next()
    const { error } = getEvents(request)

    const queryError = new Error('test')
    try {
      error(queryError)
      expect.fail('an error should have been thrown')
    } catch (err) {
      expect(err).to.equal(queryError)
    }
  })
})
