# @infinitas/systemic-mssql

Systemic mssql is a [systemic component](https://github.com/guidesmiths/systemic) for the [MS SQL](https://github.com/tediousjs/node-mssql). Its goal is to help you connect to a MS SQL database.

This library:

- includes straightforward configuration to connect to the database
- exposes query interface that prefers prepared statements for automatic sanitation to prevent sql injection
- includes easy to use sql-tag helper
- includes async iterable streaming query function to query large data sets without memory exhaustion issues
- includes transaction helpers
- exposed full connectionPool Request object for advanced scenarios
- allows setting up error handler to listen to internal connection pool errors

We've created this library as an alternative to the existing [systemic-mssql](https://github.com/guidesmiths/systemic-mssql) library, which is very opiniated, and doesn't meet our needs.

## Add Mssql to Systemic System

```typescript
import System from 'systemic'
import initDb from '@infinitas/systemic-mssql'

new System()
  .configure({
    mssql: {
      connection: 'my-connection-string',
    },
  })
  .add('mssql', initDb())
  .dependsOn('config')
  .start((err, components) => {
    // Do stuff with components.mssql
  })
```

Connection in the configuration can either be a mssql connection string or a full mssql ConnectionPool config.

## Usage

### Query

```typescript
import { Database } from '@infinitas/systemic-mssql'

interface Book {
  id: string
  title: string
}

const initBookStore = (database: Database) => ({
  getBook: (id: string) => database.query<Book>`
  SELECT *
  FROM Books
  WHERE id = ${id}`,
})
```

or

```typescript
import { Database } from '@infinitas/systemic-mssql'
import { bookQuery } from './queries'

const initBookStore = (database: Database) => ({
  getBook: (id: string) => database.query(bookQuery(id)),
})
```

All query functions use mssql [tagged template literals](https://github.com/tediousjs/node-mssql#es6-tagged-template-literals) to prevent sql injection

### Re-usable queries

```typescript
import { sql } from '@infinitas/systemic-mssql'

interface Book {
  id: string
  title: string
}

export bookQuery = (id: string) => sql`
  SELECT *
  FROM Books
  WHERE id = ${id}`
```

### Query big datasets

If you plan to work with large amount of rows, you should always use streaming to prevent memory exhaustion issues.
The streamingQuery function wraps the [mssql streaming capability](https://github.com/tediousjs/node-mssql#streaming) and exposes it as an easy to use async iterable.

```typescript
import { Database, sql } from '@infinitas/systemic-mssql'

const initBookStore = (database: Database) => ({
  getBooks: () => database.streamingQuery(sql`SELECT * FROM Books`, { size: 500 }),
})
```

The second argument to the streamingQuery function is optional can be used to set the maximum size of the buffer (in number of records). When the buffer is full the request is automatically paused until all retreived records have been read.

Here's an example of using the result of a streamingQuery:

```typescript
import { BookStore } from './stores'

const initBooksDomain = (store: BookStore) => ({
  doSomething: async () => {
    for await (const book of store.getBooks()) {
      // do something with the book
    }
  },
})
```

### Transactions

The withTransaction function allows you to write clean code that's bundled in a single transaction that's automatically commited on success. By default the entire transaction is rolled back on error, but that behaviour can be overriden by providing and onTransactionError callback.

```typescript
import { Database } from '@infinitas/systemic-mssql'

const initStore = (database: Database) => ({
  doSomething: () => {
    database.withTransaction((transaction) => {
      const request = transaction.request()
      // ... execute mulitple request within same transaction and/or include other related logic
    })
  },
})
```

WithTransaction throws if an error occures while connecting to the database or starting the transaction, therefore in the error callback it's safe to assume that there's an active database connection.

```typescript
import { Database } from '@infinitas/systemic-mssql'
import { ISOLATION_LEVEL } from 'mssql'

const initStore = (database: Database) => ({
  doSomething: () => {
    database.withTransaction(
      (transaction) => {
        // normal transaction flow
      },
      {
        isolationLevel: ISOLATION_LEVEL.READ_UNCOMMITTED,
        onTransactionError: (error, transaction) => {
          // mitigating actions
        },
      },
    )
  },
})
```

### Error handling

The onError function can be used to attach an error callback to the connection pool.

```typescript
import { system } from './system'

system.start((err, components) => {
  const { mssql } = components
  mssql.onError((error) => {
    // ... error handler
  })
})
```

### Advanced scenarios

For advanced scenarios that are not supported by any of the functions, the raw mssql Request is also available from this component:

```typescript
import { Database } from '@infinitas/systemic-mssql'

const initBookStore = (database: Database) => ({
  doAdvancedStuff: () => {
    const request = database.request()
    // do whatever you want with this request
  },
})
```
