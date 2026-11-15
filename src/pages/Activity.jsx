import { useState } from 'react'
import { ClipboardList, Inbox, Plus, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useDemo } from '../DemoContext.jsx'
import { AccountGate, BlankState, Dialog, ErrorMessage, HandoffContact, ItemMeta, ItemPhoto, ItemStatus } from '../components/ui.jsx'
import { accountById, claimsFor, handoffContact } from '../domain/model.js'

const actions = {
  approve: {
    label: 'Approve claim', title: 'Approve this claim?',
    body: 'You and this claimant will see each other’s demo contact details. This report will stop accepting new claims.',
    done: 'Claim approved. You can now see the claimant’s contact details.',
  },
  reject: {
    label: 'Reject claim', title: 'Reject this claim?',
    body: 'The claimant will see that their claim was rejected. This report will remain open.',
    done: 'Claim rejected.',
  },
  close: {
    label: 'Close report', title: 'Close this report?',
    body: 'The item will be removed from browse results and any pending claims will be closed.',
    done: 'Report closed.',
  },
  return: {
    label: 'Mark returned', title: 'Mark this item as returned?',
    body: 'Confirm that you handed the item back to its owner.',
    done: 'Item marked as returned.',
  },
}

function ClaimResponse({ listing, claim, actorId, review, onAction }) {
  return (
    <div className="claim-response">
      <div className="claim-response-heading">
        <strong>{review ? accountById[claim.claimantId].name : 'Your verification answer'}</strong>
        <ItemStatus status={claim.status} claim />
      </div>
      <p className="response-question">{claim.question}</p>
      <p className="response-answer">{claim.answer}</p>
      {claim.reason && <p className="response-note">{claim.reason}</p>}
      <HandoffContact contact={handoffContact(listing, claim, actorId)} />
      {review && listing.status === 'open' && claim.status === 'pending' && (
        <div className="inline-actions">
          <button type="button" className="button button-blue" onClick={() => onAction('approve', listing.id, claim.id)}>Approve claim</button>
          <button type="button" className="button button-secondary" onClick={() => onAction('reject', listing.id, claim.id)}>Reject claim</button>
        </div>
      )}
    </div>
  )
}

function ActivityContent() {
  const { data, actorId, account, mutate, setNotice } = useDemo()
  const [params, setParams] = useSearchParams()
  const [action, setAction] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const tab = params.get('tab') === 'claims' ? 'claims' : 'reports'
  const selected = params.get('report')
  const reports = data.listings.filter((listing) => listing.finderId === actorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const availableClaims = claimsFor(data, actorId)
  const myClaims = availableClaims.filter((claim) => claim.claimantId === actorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const backState = { backTo: `/activity?${params}`, backLabel: 'Back to My Activity' }
  const actionInfo = actions[action?.type]

  function ask(type, listingId, claimId) {
    setError('')
    setAction({ type, listingId, claimId })
  }

  async function confirmAction() {
    setBusy(true)
    setError('')
    try {
      await mutate(action)
      setNotice(actionInfo.done)
      setAction(null)
    } catch (issue) {
      setError(issue.message || 'Could not save this change. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inner-page activity">
      <header className="page-heading">
        <div><h1>My Activity</h1><p>Signed in as {account.name}</p></div>
        <Link className="button button-primary" to="/report"><Plus size={18} aria-hidden="true" /> I found an item</Link>
      </header>
      <div className="activity-tabs" role="group" aria-label="Activity view">
        <button className={tab === 'reports' ? 'selected' : ''} type="button" aria-pressed={tab === 'reports'} onClick={() => setParams({ tab: 'reports' })}>
          <ClipboardList size={18} aria-hidden="true" /> My Reports <span>{reports.length}</span>
        </button>
        <button className={tab === 'claims' ? 'selected' : ''} type="button" aria-pressed={tab === 'claims'} onClick={() => setParams({ tab: 'claims' })}>
          <ShieldCheck size={18} aria-hidden="true" /> My Claims <span>{myClaims.length}</span>
        </button>
      </div>

      {tab === 'reports' && (reports.length ? (
        <div className="activity-stack">
          {reports.map((listing) => {
            const claims = availableClaims.filter((claim) => claim.listingId === listing.id)
            const pendingCount = claims.filter((claim) => claim.status === 'pending').length
            const expanded = selected === listing.id
            const claimRegion = `claims-for-${listing.id}`
            return (
              <article className="panel activity-card" key={listing.id}>
                <div className="activity-card-main">
                  <div className="activity-photo"><ItemPhoto photo={listing.photo} alt="" /></div>
                  <div className="activity-item-info">
                    <ItemStatus status={listing.status} />
                    <h2><Link to={`/items/${listing.id}`} state={backState}>{listing.title}</Link></h2>
                    <ItemMeta listing={listing} />
                  </div>
                </div>
                <div className="inline-actions report-actions">
                  {claims.length > 0 ? (
                    <button className="button button-blue" type="button" aria-expanded={expanded} aria-controls={claimRegion}
                      onClick={() => setParams(expanded ? { tab: 'reports' } : { tab: 'reports', report: listing.id })}>
                      {expanded ? 'Hide claims' : pendingCount ? 'Review claims' : 'View claims'}
                      {pendingCount > 0 && <span className="action-count">{pendingCount}</span>}
                    </button>
                  ) : <span className="muted">No claims yet</span>}
                  {listing.status === 'open' && <>
                    <Link className="button button-secondary" to={`/report/${listing.id}`}>Edit report</Link>
                    <button type="button" className="button button-quiet" onClick={() => ask('close', listing.id)}>Close report</button>
                  </>}
                  {listing.status === 'awaiting-return' && (
                    <button type="button" className="button button-primary" onClick={() => ask('return', listing.id)}>Mark returned</button>
                  )}
                </div>
                {claims.length > 0 && (
                  <div className="report-claim-list" id={claimRegion} hidden={!expanded}>
                    {expanded && claims.map((claim) => <ClaimResponse key={claim.id} listing={listing} claim={claim} actorId={actorId} review onAction={ask} />)}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : <BlankState icon={Inbox} title="No reports yet" action={<Link to="/report" className="button button-primary">Report a found item</Link>}>
        The items you report will appear here.
      </BlankState>)}

      {tab === 'claims' && (myClaims.length ? (
        <div className="activity-stack">
          {myClaims.map((claim) => {
            const listing = data.listings.find(({ id }) => id === claim.listingId)
            return (
              <article className="panel activity-card" key={claim.id}>
                <div className="activity-card-main">
                  <div className="activity-photo"><ItemPhoto photo={listing.photo} alt="" /></div>
                  <div className="activity-item-info">
                    <ItemStatus status={listing.status} />
                    <h2><Link to={`/items/${listing.id}`} state={backState}>{listing.title}</Link></h2>
                    <ItemMeta listing={listing} />
                  </div>
                </div>
                <ClaimResponse listing={listing} claim={claim} actorId={actorId} />
              </article>
            )
          })}
        </div>
      ) : <BlankState icon={Inbox} title="No claims yet" action={<Link to="/" className="button button-primary">Browse items</Link>}>
        When you claim an item, you can track the finder’s decision here.
      </BlankState>)}

      {actionInfo && (
        <Dialog title={actionInfo.title} onClose={() => setAction(null)} busy={busy}>
          <p>{actionInfo.body}</p>
          <ErrorMessage>{error}</ErrorMessage>
          <div className="dialog-actions">
            <button type="button" className="button button-secondary" disabled={busy} onClick={() => setAction(null)}>Cancel</button>
            <button type="button" className={`button ${['close', 'reject'].includes(action.type) ? 'button-danger' : 'button-blue'}`}
              disabled={busy} onClick={confirmAction}>{busy ? 'Saving…' : actionInfo.label}</button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export function Activity() {
  const { actorId } = useDemo()
  return actorId ? <ActivityContent key={actorId} /> : (
    <AccountGate title="Sign in to see your activity">Choose a demo account to view its reports and claims.</AccountGate>
  )
}
