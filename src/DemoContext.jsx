import { createContext, useContext, useEffect, useState } from 'react'
import { accountById } from './domain/model.js'
import { loadDemo, resetDemo, saveAction } from './domain/storage.js'

const DemoContext = createContext(null)
const accountKey = 'illini-finders-demo-account'

function initialAccount() {
  try {
    const id = sessionStorage.getItem(accountKey)
    return Object.hasOwn(accountById, id) ? id : null
  } catch {
    return null
  }
}

export function DemoProvider({ children }) {
  const [actorId, setActorId] = useState(initialAccount)
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [signIn, setSignIn] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    loadDemo().then(({ state }) => {
      if (!cancelled) setData(state)
    }).catch(() => {
      if (!cancelled) setLoadError('Your browser could not load the demo data. Check that site storage is enabled, then try again.')
    })
    return () => { cancelled = true }
  }, [attempt])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 6500)
    return () => clearTimeout(timer)
  }, [notice])

  function setAccount(id) {
    setActorId(id)
    try {
      if (id) sessionStorage.setItem(accountKey, id)
      else sessionStorage.removeItem(accountKey)
    } catch {
      // The selected demo identity is still available until the tab reloads.
    }
  }

  function chooseAccount(id) {
    const resume = signIn?.resume
    setAccount(id)
    setSignIn(null)
    resume?.(id)
  }

  async function mutate(action) {
    const { state, result } = await saveAction(action, actorId)
    setData(state)
    return result
  }

  async function reset() {
    const { state } = await resetDemo()
    setData(state)
    setLoadError('')
    setAccount(null)
    setNotice('Demo reset. The original reports and claims are ready.')
  }

  function requireAccount(resume) {
    if (actorId) resume(actorId)
    else setSignIn({ resume })
  }

  return (
    <DemoContext.Provider value={{
      account: accountById[actorId], actorId, data, loadError, mutate, reset, notice, setNotice, signIn, chooseAccount,
      requireAccount, showAccounts: () => setSignIn({}), dismissAccounts: () => setSignIn(null),
      reload: () => { setLoadError(''); setAttempt((current) => current + 1) },
    }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  return useContext(DemoContext)
}
