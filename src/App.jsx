import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, CircleAlert, LogIn, LogOut, MapPin, Plus, RotateCcw, X } from 'lucide-react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router'
import { DemoProvider, useDemo } from './DemoContext.jsx'
import { BlankState, Dialog, ErrorMessage } from './components/ui.jsx'
import { accounts } from './domain/model.js'
import { Browse } from './pages/Browse.jsx'
import { ItemDetail } from './pages/ItemDetail.jsx'
import { ReportForm } from './pages/ReportForm.jsx'
import { Activity } from './pages/Activity.jsx'

function AccountDialog() {
  const { account, signIn, chooseAccount, dismissAccounts } = useDemo()
  if (!signIn) return null

  return (
    <Dialog title={account ? 'Switch demo account' : 'Choose a demo account'} onClose={dismissAccounts}>
      <p>Try reporting and claiming as one of these sample campus users.</p>
      <div className="account-options">
        {accounts.map((person) => (
          <button type="button" className="account-option" key={person.id} onClick={() => chooseAccount(person.id)}>
            <span className="avatar">{person.initials}</span>
            <span>{person.name}</span>
            {account?.id === person.id && <Check size={18} aria-label="Current account" />}
          </button>
        ))}
      </div>
      <div className="dialog-actions">
        {account && <button type="button" className="button button-quiet" onClick={() => chooseAccount(null)}><LogOut size={16} /> Sign out</button>}
        <button type="button" className="button button-secondary" onClick={dismissAccounts}>Cancel</button>
      </div>
    </Dialog>
  )
}

function Header() {
  const { account, requireAccount, showAccounts } = useDemo()
  const navigate = useNavigate()
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand" aria-label="Campus Lost and Found home">
          <span className="brand-mark"><MapPin size={23} strokeWidth={2.4} aria-hidden="true" /></span>
          <span><strong>Campus Lost &amp; Found</strong><small>UNIVERSITY OF ILLINOIS</small></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Browse</NavLink>
          <NavLink to="/activity">My Activity</NavLink>
        </nav>
        <div className="header-actions">
          <button className="button button-primary header-report" type="button" onClick={() => requireAccount(() => navigate('/report'))}>
            <Plus size={18} aria-hidden="true" /> I found an item
          </button>
          <button className="button button-quiet account-trigger" type="button" aria-haspopup="dialog" onClick={showAccounts}>
            {account
              ? <><span className="avatar avatar-small">{account.initials}</span><span>{account.name}</span><ChevronDown size={13} aria-hidden="true" /></>
              : <><LogIn size={17} aria-hidden="true" /><span>Demo sign in</span></>}
          </button>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const navigate = useNavigate()
  const { reset } = useDemo()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirmReset() {
    setBusy(true)
    setError('')
    try {
      await reset()
      setConfirming(false)
      navigate('/', { replace: true })
    } catch {
      setError('Could not reset the demo. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <span><strong>Illini Finders</strong> <span className="footer-dot">·</span> CS 409 classroom prototype</span>
        <button className="button button-quiet reset-button" type="button" onClick={() => { setError(''); setConfirming(true) }}>
          <RotateCcw size={15} aria-hidden="true" /> Reset demo
        </button>
      </div>
      {confirming && (
        <Dialog title="Reset the demo?" onClose={() => setConfirming(false)} busy={busy}>
          <p>This removes reports, photos, and claims you added in this browser and restores the sample data.</p>
          <ErrorMessage>{error}</ErrorMessage>
          <div className="dialog-actions">
            <button type="button" className="button button-secondary" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
            <button type="button" className="button button-danger" disabled={busy} onClick={confirmReset}>{busy ? 'Resetting…' : 'Reset demo'}</button>
          </div>
        </Dialog>
      )}
    </footer>
  )
}

function Layout() {
  const { data, loadError, reload, notice, setNotice } = useDemo()
  const { pathname } = useLocation()
  const mainRef = useRef(null)
  const previousPath = useRef(pathname)

  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    window.scrollTo(0, 0)
    mainRef.current.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="site-layout">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); mainRef.current.focus() }}>Skip to content</a>
      <Header />
      <main id="main-content" ref={mainRef} tabIndex={-1} className="shell main-content">
        {loadError ? (
          <BlankState icon={CircleAlert} title="Could not load the demo"
            action={<button type="button" className="button button-primary" onClick={reload}>Try again</button>}>
            {loadError}
          </BlankState>
        ) : data ? (
          <Routes>
            <Route path="/" element={<Browse />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/report" element={<ReportForm />} />
            <Route path="/report/:id" element={<ReportForm />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="*" element={<BlankState title="Page not found" action={<Link className="button button-primary" to="/">Browse items</Link>} />} />
          </Routes>
        ) : <p className="load-status" role="status">Loading campus reports…</p>}
      </main>
      <Footer />
      <AccountDialog />
      <div className="notice-region" role="status">
        {notice && (
          <div className="notice">
            <Check size={19} aria-hidden="true" />
            <span>{notice}</span>
            <button type="button" className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={17} /></button>
          </div>
        )}
      </div>
    </div>
  )
}

export function App() {
  return <DemoProvider><Layout /></DemoProvider>
}
