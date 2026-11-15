import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, CircleAlert, CircleHelp, ImageOff, LogIn, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { useDemo } from '../DemoContext.jsx'
import { locationLabel } from '../domain/campus.js'
import { categoryById, claimLabels, listingLabels, readableDate } from '../domain/model.js'

const samplePhotos = import.meta.glob('../assets/items/*.jpg', { eager: true, import: 'default' })

export function ItemPhoto({ photo, alt, eager = false }) {
  const [preview, setPreview] = useState(null)
  const blob = photo?.blob
  useEffect(() => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    setPreview({ blob, url })
    return () => URL.revokeObjectURL(url)
  }, [blob])

  const src = blob && preview?.blob === blob ? preview.url : samplePhotos[`../assets/items/${photo?.sample}.jpg`]
  return src
    ? <img src={src} alt={alt} className="item-image" loading={eager ? 'eager' : 'lazy'} />
    : <div className="photo-placeholder" aria-hidden="true"><ImageOff size={24} /></div>
}

export function Category({ id }) {
  return <span className={`category category-${id}`}>{categoryById[id].name}</span>
}

export function ItemStatus({ status, claim = false }) {
  return <span className={`status status-${status}`}>{(claim ? claimLabels : listingLabels)[status]}</span>
}

export function ItemMeta({ listing }) {
  return (
    <div className="item-meta">
      <span><MapPin size={15} aria-hidden="true" /> {locationLabel(listing.location)}</span>
      <span><CalendarDays size={15} aria-hidden="true" /> <time dateTime={listing.foundDate}>{readableDate(listing.foundDate)}</time></span>
    </div>
  )
}

export function ItemCard({ listing, detailState, eager = false }) {
  return (
    <article className="item-card">
      <Link className="item-link" to={`/items/${listing.id}`} state={detailState}>
        <div className="card-photo"><ItemPhoto photo={listing.photo} alt="" eager={eager} /></div>
        <div className="item-card-body">
          <Category id={listing.category} />
          <h3>{listing.title}</h3>
          <ItemMeta listing={listing} />
        </div>
        <span className="card-arrow" aria-hidden="true"><ArrowRight size={17} /></span>
      </Link>
    </article>
  )
}

export function BlankState({ icon: Icon = CircleHelp, title, children, action }) {
  return (
    <section className="blank-state">
      <Icon aria-hidden="true" size={28} />
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </section>
  )
}

export function AccountGate({ title, children }) {
  const { showAccounts } = useDemo()
  return (
    <BlankState icon={LogIn} title={title}
      action={<button type="button" className="button button-primary" onClick={showAccounts}>Choose a demo account</button>}>
      {children}
    </BlankState>
  )
}

export function HandoffContact({ contact }) {
  return contact && (
    <div className="handoff-contact">
      <Mail size={19} aria-hidden="true" />
      <div><strong>Handoff contact</strong><span>{contact.name} · {contact.contact}</span></div>
    </div>
  )
}

export function ErrorMessage({ children }) {
  return children ? <p className="error-message" role="alert"><CircleAlert size={17} aria-hidden="true" /> {children}</p> : null
}

export function Dialog({ title, children, onClose, busy = false }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} onCancel={(event) => {
      event.preventDefault()
      if (!busy) onClose()
    }}>
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  )
}
