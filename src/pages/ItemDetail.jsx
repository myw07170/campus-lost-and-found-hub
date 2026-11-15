import { useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { useDemo } from '../DemoContext.jsx'
import { BlankState, Category, Dialog, ErrorMessage, HandoffContact, ItemPhoto, ItemStatus } from '../components/ui.jsx'
import { locationLabel } from '../domain/campus.js'
import { canClaim, claimsFor, handoffContact, readableDate } from '../domain/model.js'

function ClaimForm({ listing, onClose }) {
  const { mutate, setNotice } = useDemo()
  const navigate = useNavigate()
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    if (!answer.trim()) {
      setError('Enter an answer to the verification question.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await mutate({ type: 'claim', listingId: listing.id, question: listing.question, answer })
      onClose()
      setNotice('Claim submitted. Track its status in My Claims.')
      navigate('/activity?tab=claims')
    } catch (issue) {
      setError(issue.message || 'Could not submit your claim. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title="Claim item" onClose={onClose} busy={busy}>
      <p>Your answer goes to the finder for review. Use only details that help identify the item.</p>
      <form onSubmit={submit} noValidate>
        <label htmlFor="claim-answer" className="claim-question">{listing.question}</label>
        <textarea id="claim-answer" className="control" rows="4" maxLength={600} required value={answer}
          onChange={(event) => { setAnswer(event.target.value); setError('') }}
          aria-invalid={Boolean(error)} aria-describedby={error ? 'claim-error' : undefined} />
        <div id="claim-error"><ErrorMessage>{error}</ErrorMessage></div>
        <div className="dialog-actions">
          <button type="button" className="button button-secondary" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit claim'}</button>
        </div>
      </form>
    </Dialog>
  )
}

export function ItemDetail() {
  const { id } = useParams()
  const { state } = useLocation()
  const { data, actorId, requireAccount } = useDemo()
  const [claimActor, setClaimActor] = useState(null)
  const listing = data.listings.find((item) => item.id === id)

  if (!listing) {
    return <BlankState title="Report unavailable" action={<Link className="button button-primary" to="/">Browse items</Link>}>
      This report may have been removed when the demo was reset.
    </BlankState>
  }

  const owner = listing.finderId === actorId
  const ownClaim = claimsFor(data, actorId).find((claim) => claim.listingId === id && claim.claimantId === actorId)
  const available = canClaim(data, listing, actorId)
  const closeClaim = () => setClaimActor(null)

  return (
    <div className="inner-page item-detail">
      <Link to={state?.backTo ?? '/'} className="back-link"><ArrowLeft size={17} aria-hidden="true" /> {state?.backLabel ?? 'Browse items'}</Link>
      <div className="detail-heading">
        <div className="item-badges"><Category id={listing.category} /><ItemStatus status={listing.status} /></div>
        <h1>{listing.title}</h1>
      </div>
      <div className="detail-grid">
        <div className="detail-photo"><ItemPhoto photo={listing.photo} alt={listing.title} eager /></div>
        <div className="detail-side">
          <section className="panel detail-panel">
            <h2>About this item</h2>
            <p className="item-description">{listing.description}</p>
            <dl className="detail-facts">
              <div><MapPin size={19} aria-hidden="true" /><span><dt>Found at</dt><dd>{locationLabel(listing.location)}</dd></span></div>
              <div><CalendarDays size={19} aria-hidden="true" /><span><dt>Date found</dt><dd><time dateTime={listing.foundDate}>{readableDate(listing.foundDate)}</time></dd></span></div>
            </dl>
          </section>
          <section className="panel claim-panel">
            <div className="claim-panel-title"><ShieldCheck size={22} aria-hidden="true" /><h2>{owner ? 'Your report' : 'Is this yours?'}</h2></div>
            {owner ? (
              <>
                <p>Manage this report and review its claims from My Reports.</p>
                <Link className="button button-primary" to={`/activity?tab=reports&report=${id}`}>Manage report <ArrowRight size={17} aria-hidden="true" /></Link>
              </>
            ) : ownClaim ? (
              <>
                <div className="claim-status-line">Your claim <ItemStatus status={ownClaim.status} claim /></div>
                <HandoffContact contact={handoffContact(listing, ownClaim, actorId)} />
                <Link className="button button-secondary" to="/activity?tab=claims">View my claim <ArrowRight size={17} aria-hidden="true" /></Link>
              </>
            ) : listing.status === 'open' ? (
              <>
                <p>Answer the finder’s question. Your response is shared privately with the finder in this demo.</p>
                <button type="button" className="button button-primary" onClick={() => requireAccount(setClaimActor)}>Claim item <ArrowRight size={17} aria-hidden="true" /></button>
              </>
            ) : (
              <p>{listing.status === 'awaiting-return' ? 'The finder is arranging a handoff with the approved claimant.' : 'This report is closed to new claims.'}</p>
            )}
          </section>
        </div>
      </div>
      {available && claimActor === actorId && <ClaimForm listing={listing} onClose={closeClaim} />}
    </div>
  )
}
