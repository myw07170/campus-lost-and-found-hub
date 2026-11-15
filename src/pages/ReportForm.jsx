import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Building2, Camera, ImagePlus, MapPin, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { useDemo } from '../DemoContext.jsx'
import { CampusMap, MapAttribution, mapPosition } from '../components/CampusMap.jsx'
import { AccountGate, BlankState, Category, ErrorMessage, ItemMeta, ItemPhoto } from '../components/ui.jsx'
import { buildings, locationLabel, nearestBuilding } from '../domain/campus.js'
import { categories, draftErrors, todayOnCampus } from '../domain/model.js'

async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image under 10 MB.')

  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error()
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
    if (!blob) throw new Error()
    return { blob }
  } catch {
    throw new Error('This image could not be opened. Choose another photo.')
  } finally {
    URL.revokeObjectURL(url)
  }
}

function fieldProps(id, error) {
  return { id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined }
}

function Field({ id, label, error, children, className = '' }) {
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  )
}

function ReportEditor({ listing }) {
  const { mutate, setNotice } = useDemo()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(() => listing ?? {
    title: '', description: '', category: '', foundDate: todayOnCampus(), question: '', photo: null, location: null,
  })
  const [mode, setMode] = useState(listing?.location.pin ? 'pin' : 'building')
  const [proposedPin, setProposedPin] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [readingPhoto, setReadingPhoto] = useState(false)
  const [review, setReview] = useState(false)
  const [saveError, setSaveError] = useState('')
  const request = useRef(0)
  const titleRef = useRef(null)
  const backTo = listing ? '/activity?tab=reports' : '/'

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  async function choosePhoto(event) {
    const [file] = event.target.files
    event.target.value = ''
    if (!file) return
    const id = ++request.current
    setReadingPhoto(true)
    try {
      const photo = await preparePhoto(file)
      if (request.current === id) update('photo', photo)
    } catch (issue) {
      if (request.current === id) setErrors((current) => ({ ...current, photo: issue.message }))
    } finally {
      if (request.current === id) setReadingPhoto(false)
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setProposedPin(null)
    update('location', null)
  }

  function changeStep(next) {
    setReview(next)
    setSaveError('')
    window.scrollTo(0, 0)
    requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }))
  }

  function reviewDraft(event) {
    event.preventDefault()
    const next = draftErrors(draft)
    if (proposedPin) next.location = 'Confirm this pin before reviewing the report.'
    setErrors(next)
    const firstField = ['title', 'category', 'foundDate', 'description', 'photo', 'location', 'question'].find((field) => next[field])
    if (firstField) {
      requestAnimationFrame(() => document.getElementById(`report-${firstField}`)?.focus())
    } else {
      changeStep(true)
    }
  }

  async function publish() {
    if (busy) return
    setBusy(true)
    setSaveError('')
    try {
      const id = await mutate({ type: listing ? 'edit' : 'publish', listingId: listing?.id, draft })
      setNotice(listing ? 'Report updated.' : 'Report published. It now appears in Browse.')
      navigate(`/items/${id}`, {
        state: { backTo, backLabel: listing ? 'Back to My Reports' : 'Browse items' },
      })
    } catch (issue) {
      setSaveError(issue.message || 'Could not save the report. Your draft is ready to retry.')
    } finally {
      setBusy(false)
    }
  }

  const activePin = proposedPin ?? draft.location?.pin
  const building = proposedPin && nearestBuilding(proposedPin.x, proposedPin.y)

  return (
    <div className="inner-page report-page">
      <Link className="back-link" to={backTo}><ArrowLeft size={17} aria-hidden="true" /> {listing ? 'My Reports' : 'Browse items'}</Link>
      <header className="page-heading">
        <div>
          <h1 tabIndex={-1} ref={titleRef}>{review ? 'Review your report' : listing ? 'Edit report' : 'Report a found item'}</h1>
          <p>{review ? 'Check how the item will appear before you save.' : 'Give the owner enough information to recognize the item.'}</p>
        </div>
        <ol className="report-steps" aria-label="Report progress">
          <li aria-current={review ? undefined : 'step'}><span>1</span> Item details</li>
          <li aria-current={review ? 'step' : undefined}><span>2</span> Review</li>
        </ol>
      </header>

      {review ? (
        <div className="review-layout">
          <div className="detail-photo"><ItemPhoto photo={draft.photo} alt={draft.title} eager /></div>
          <div className="panel review-panel">
            <Category id={draft.category} />
            <h2>{draft.title}</h2>
            <ItemMeta listing={draft} />
            <p className="item-description">{draft.description}</p>
            <div className="form-tip"><ShieldCheck size={21} aria-hidden="true" /><div><strong>Question shown to claimants</strong><p>{draft.question}</p></div></div>
            <ErrorMessage>{saveError}</ErrorMessage>
            <div className="inline-actions review-actions">
              <button className="button button-secondary" type="button" disabled={busy} onClick={() => changeStep(false)}>Back to edit</button>
              <button className="button button-primary" type="button" disabled={busy} onClick={publish}>
                {busy ? 'Saving…' : listing ? 'Save changes' : 'Publish report'} <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form className="report-editor" noValidate onSubmit={reviewDraft}>
          <section className="panel form-panel">
            <h2>Item details</h2>
            <div className="form-grid">
              <Field id="report-title" label="Item name" error={errors.title} className="span-fields">
                <input className="control" {...fieldProps('report-title', errors.title)} required maxLength={80} placeholder="e.g. Blue metal water bottle"
                  value={draft.title} onChange={(event) => update('title', event.target.value)} />
              </Field>
              <Field id="report-category" label="Category" error={errors.category}>
                <select className="control" {...fieldProps('report-category', errors.category)} required value={draft.category}
                  onChange={(event) => update('category', event.target.value)}>
                  <option value="">Choose a category</option>
                  {categories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                </select>
              </Field>
              <Field id="report-foundDate" label="Date found" error={errors.foundDate}>
                <input type="date" className="control" {...fieldProps('report-foundDate', errors.foundDate)} required max={todayOnCampus()}
                  value={draft.foundDate} onChange={(event) => update('foundDate', event.target.value)} />
              </Field>
              <Field id="report-description" label="Public description" error={errors.description} className="span-fields">
                <textarea className="control" {...fieldProps('report-description', errors.description)} required rows="3" maxLength={600}
                  placeholder="Describe the item and the area where you found it." value={draft.description}
                  onChange={(event) => update('description', event.target.value)} />
              </Field>
            </div>
          </section>
          <section className="panel form-panel">
            <h2>Item photo</h2>
            <p>Show the item clearly. Keep names, IDs, contact details, and the verification answer out of the photo and public description.</p>
            <div className="photo-input">
              {draft.photo && <div className="upload-preview"><ItemPhoto photo={draft.photo} alt="Selected item photo" eager /></div>}
              <label className="upload-target" htmlFor="report-photo">
                <input className="sr-only" type="file" {...fieldProps('report-photo', errors.photo)}
                  accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
                <span className="upload-icon">{draft.photo ? <Camera size={22} /> : <ImagePlus size={22} />}</span>
                <strong>{readingPhoto ? 'Preparing photo…' : draft.photo ? 'Replace photo' : 'Choose a photo'}</strong>
                <small>JPG, PNG, or WebP · up to 10 MB</small>
              </label>
            </div>
            {errors.photo && <p className="field-error" id="report-photo-error">{errors.photo}</p>}
          </section>
          <section className="panel form-panel">
            <h2>Found location</h2>
            <div className="location-switch" role="group" aria-label="How to add a location">
              <button type="button" className={`button ${mode === 'building' ? 'button-blue' : 'button-secondary'}`}
                aria-pressed={mode === 'building'} onClick={() => { if (mode !== 'building') switchMode('building') }}><Building2 size={18} /> Choose a building</button>
              <button type="button" className={`button ${mode === 'pin' ? 'button-blue' : 'button-secondary'}`}
                aria-pressed={mode === 'pin'} onClick={() => { if (mode !== 'pin') switchMode('pin') }}><MapPin size={18} /> Drop a pin</button>
            </div>
            {mode === 'building' ? (
              <Field id="report-location" label="Campus building" error={errors.location}>
                <select className="control" {...fieldProps('report-location', errors.location)} required
                  value={draft.location?.buildingId ?? ''} onChange={(event) => update('location', { buildingId: event.target.value })}>
                  <option value="">Choose where you found it</option>
                  {buildings.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                </select>
              </Field>
            ) : (
              <div id="report-location" tabIndex={-1}>
                <p className="pin-instructions">Click or tap the map where you found the item, then confirm the location.</p>
                <CampusMap onPick={(x, y) => setProposedPin({ x, y })}>
                  {activePin && <span className="map-marker drop-pin" style={mapPosition(activePin)}><MapPin size={19} /></span>}
                </CampusMap>
                <MapAttribution />
                {proposedPin ? (
                  <div className="inline-actions pin-confirmation">
                    <strong>Near {building.name}</strong>
                    <button className="button button-blue" type="button" onClick={() => {
                      update('location', { buildingId: building.id, pin: proposedPin })
                      setProposedPin(null)
                    }}>Use this pin</button>
                  </div>
                ) : draft.location && <p className="confirmed-pin"><MapPin size={16} /> {locationLabel(draft.location)} · Pin confirmed</p>}
                {errors.location && <p className="field-error">{errors.location}</p>}
              </div>
            )}
          </section>
          <section className="panel form-panel">
            <h2>Ownership check</h2>
            <p>Ask about a detail only the owner would know. You’ll use their answer to decide whether to approve a claim.</p>
            <Field id="report-question" label="Verification question" error={errors.question}>
              <input className="control" {...fieldProps('report-question', errors.question)} maxLength={200} required
                placeholder="e.g. What is written on the bottom of the bottle?" value={draft.question}
                onChange={(event) => update('question', event.target.value)} />
            </Field>
          </section>
          <div className="form-actions">
            <Link className="button button-secondary" to={backTo}>Cancel</Link>
            <button type="submit" className="button button-primary" disabled={readingPhoto}>Review report <ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </form>
      )}
    </div>
  )
}

export function ReportForm() {
  const { id } = useParams()
  const { actorId, data } = useDemo()
  if (!actorId) return <AccountGate title="Sign in to report an item">Choose a demo account to continue.</AccountGate>
  const listing = id ? data.listings.find((item) => item.id === id) : undefined
  if (id && (listing?.finderId !== actorId || listing.status !== 'open')) {
    return <BlankState title="This report can’t be edited" action={<Link className="button button-primary" to="/activity">Go to My Reports</Link>}>
      Only the finder can edit an open report.
    </BlankState>
  }
  return <ReportEditor key={`${actorId}:${id ?? 'new'}`} listing={listing} />
}
