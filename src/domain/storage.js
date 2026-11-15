import { changeDemo } from './model.js'
import { seedDemo } from './seed.js'

const databaseName = 'illini-finders-campus-demo'
const storeName = 'prototype'
const stateKey = 'demo'

function connect() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(storeName)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Close other tabs of this demo, then try again.'))
  })
}

async function withState(update) {
  const database = await connect()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.get(stateKey)
      let outcome
      let actionError
      request.onsuccess = () => {
        try {
          const existing = request.result
          const state = existing ?? seedDemo()
          outcome = update ? update(state) : { state }
          if (!existing || update) store.put(outcome.state, stateKey)
        } catch (error) {
          actionError = error
          transaction.abort()
        }
      }
      transaction.oncomplete = () => resolve(outcome)
      transaction.onabort = () => reject(actionError ?? transaction.error ?? new Error('Saving was interrupted. Try again.'))
    })
  } finally {
    database.close()
  }
}

export const loadDemo = () => withState()
export const saveAction = (action, actorId) => withState((state) => changeDemo(state, action, actorId))
export const resetDemo = () => withState(() => ({ state: seedDemo() }))
