import { buildingById, locationLabel, nearestBuilding } from './campus.js'

export const accounts = [
  { id: 'avery', name: 'Avery Chen', contact: 'avery@example.test', initials: 'AC' },
  { id: 'jordan', name: 'Jordan Lee', contact: 'jordan@example.test', initials: 'JL' },
]
export const accountById = Object.fromEntries(accounts.map((account) => [account.id, account]))

export const categories = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'keys', name: 'Keys & IDs' },
  { id: 'school', name: 'School supplies' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'other', name: 'Other' },
]
export const categoryById = Object.fromEntries(categories.map((category) => [category.id, category]))

export const listingLabels = {
  open: 'Open',
  'awaiting-return': 'Handoff pending',
  returned: 'Returned',
  closed: 'Closed',
}

export const claimLabels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }
export const dateOptions = [
  { id: '7', name: 'Last 7 days' },
  { id: '30', name: 'Last 30 days' },
]

const campusDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
})
const displayDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric',
})

export function todayOnCampus(now = new Date()) {
  return campusDate.format(now)
}

export function daysBefore(date, offset) {
  const day = new Date(`${date}T12:00:00Z`)
  day.setUTCDate(day.getUTCDate() - offset)
  return day.toISOString().slice(0, 10)
}

export function readableDate(date) {
  return displayDate.format(new Date(`${date}T12:00:00Z`))
}

export function draftErrors(draft, today = todayOnCampus()) {
  const errors = {}
  const textLimits = { title: 80, description: 600, question: 200 }
  const requiredMessages = {
    title: 'Enter an item name.',
    description: 'Describe the item and where you found it.',
    question: 'Enter a question only the owner can answer.',
  }
  for (const [field, max] of Object.entries(textLimits)) {
    const value = draft[field]?.trim()
    if (!value) errors[field] = requiredMessages[field]
    else if (value.length > max) errors[field] = `Use ${max} characters or fewer.`
  }
  if (!Object.hasOwn(categoryById, draft.category)) errors.category = 'Pick a category.'
  if (!draft.photo?.sample && !(draft.photo?.blob instanceof Blob)) errors.photo = 'Add a photo of the item.'
  const date = new Date(`${draft.foundDate}T12:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.foundDate) || Number.isNaN(date.getTime())
    || date.toISOString().slice(0, 10) !== draft.foundDate || draft.foundDate > today) {
    errors.foundDate = 'Enter a valid date on or before today.'
  }
  if (!Object.hasOwn(buildingById, draft.location?.buildingId)) {
    errors.location = 'Choose a building or drop a pin.'
  } else if (draft.location.pin) {
    const { x, y } = draft.location.pin
    if (![x, y].every((coordinate) => Number.isFinite(coordinate) && coordinate >= 0 && coordinate <= 1)) {
      errors.location = 'Choose a location within the campus map.'
    }
  }
  return errors
}

export function filterListings(listings, filters, today = todayOnCampus()) {
  const terms = (filters.query ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean)
  const dateRange = dateOptions.some((option) => option.id === filters.date) ? Number(filters.date) : null
  const cutoff = dateRange ? daysBefore(today, dateRange - 1) : null
  return listings.filter((listing) => {
    if (listing.status !== 'open' || (filters.category && listing.category !== filters.category)
      || (filters.building && listing.location.buildingId !== filters.building)
      || (cutoff && listing.foundDate < cutoff)) return false
    const publicText = [listing.title, listing.description, locationLabel(listing.location),
      categoryById[listing.category].name].join(' ').toLowerCase()
    return terms.every((term) => publicText.includes(term))
  }).sort((a, b) => b.foundDate.localeCompare(a.foundDate) || b.createdAt.localeCompare(a.createdAt))
}

export function canViewClaim(listing, claim, actorId) {
  return Boolean(Object.hasOwn(accountById, actorId) && listing?.id === claim.listingId
    && (actorId === listing.finderId || actorId === claim.claimantId))
}

export function claimsFor(state, actorId) {
  return state.claims.filter((claim) => {
    const listing = state.listings.find(({ id }) => id === claim.listingId)
    return canViewClaim(listing, claim, actorId)
  })
}

export function handoffContact(listing, claim, actorId) {
  if (claim?.status !== 'approved' || !canViewClaim(listing, claim, actorId)) return null
  return accountById[actorId === listing.finderId ? claim.claimantId : listing.finderId]
}

export function canClaim(state, listing, actorId) {
  return Boolean(Object.hasOwn(accountById, actorId) && listing?.status === 'open' && listing.finderId !== actorId
    && !state.claims.some((claim) => claim.listingId === listing.id && claim.claimantId === actorId))
}

function requireAction(condition, message) {
  if (!condition) throw new Error(message)
}

export function changeDemo(state, action, actorId, now = new Date(), makeId = () => crypto.randomUUID()) {
  requireAction(Object.hasOwn(accountById, actorId), 'Choose a demo account to continue.')
  const listing = state.listings.find(({ id }) => id === action.listingId)
  const timestamp = now.toISOString()

  switch (action.type) {
    case 'publish':
    case 'edit': {
      const editing = action.type === 'edit'
      requireAction(!editing || (listing?.finderId === actorId && listing.status === 'open'),
        'Only the finder can edit an open report.')
      const draft = action.draft
      const errors = draftErrors(draft, todayOnCampus(now))
      requireAction(!Object.keys(errors).length, Object.values(errors)[0])
      const { pin, buildingId } = draft.location
      const nextListing = {
        id: editing ? listing.id : makeId(),
        finderId: actorId,
        status: 'open',
        createdAt: editing ? listing.createdAt : timestamp,
        title: draft.title.trim(),
        description: draft.description.trim(),
        question: draft.question.trim(),
        category: draft.category,
        foundDate: draft.foundDate,
        photo: draft.photo,
        location: pin ? { buildingId: nearestBuilding(pin.x, pin.y).id, pin } : { buildingId },
      }
      return {
        state: {
          ...state,
          listings: editing
            ? state.listings.map((item) => item.id === listing.id ? nextListing : item)
            : [...state.listings, nextListing],
        },
        result: nextListing.id,
      }
    }
    case 'claim': {
      requireAction(canClaim(state, listing, actorId), 'This item is unavailable for a new claim from this account.')
      requireAction(action.question === listing.question, 'The finder updated the verification question. Reload the item and try again.')
      const answer = action.answer.trim()
      requireAction(answer && answer.length <= 600, 'Enter an answer of up to 600 characters.')
      const claim = {
        id: makeId(), listingId: listing.id, claimantId: actorId, status: 'pending',
        question: listing.question, answer, createdAt: timestamp,
      }
      return { state: { ...state, claims: [...state.claims, claim] }, result: claim.id }
    }
    case 'approve':
    case 'reject': {
      const claim = state.claims.find(({ id }) => id === action.claimId)
      requireAction(listing?.finderId === actorId && listing.status === 'open'
        && claim?.listingId === listing.id && claim.status === 'pending',
      'Only the finder can decide a pending claim on an open report.')
      const approved = action.type === 'approve'
      const claims = state.claims.map((entry) => {
        if (entry.id === claim.id) return { ...entry, status: approved ? 'approved' : 'rejected', decidedAt: timestamp }
        if (approved && entry.listingId === listing.id && entry.status === 'pending') {
          return { ...entry, status: 'rejected', reason: 'The finder approved another claim.', decidedAt: timestamp }
        }
        return entry
      })
      const listings = approved
        ? state.listings.map((item) => item.id === listing.id ? { ...item, status: 'awaiting-return' } : item)
        : state.listings
      return { state: { ...state, claims, listings } }
    }
    case 'close':
    case 'return': {
      const returning = action.type === 'return'
      const requiredStatus = returning ? 'awaiting-return' : 'open'
      requireAction(listing?.finderId === actorId && listing.status === requiredStatus,
        'This report cannot be updated from its current status.')
      const status = returning ? 'returned' : 'closed'
      const listings = state.listings.map((item) => item.id === listing.id ? { ...item, status } : item)
      const claims = returning ? state.claims : state.claims.map((claim) => {
        if (claim.listingId !== listing.id || claim.status !== 'pending') return claim
        return { ...claim, status: 'rejected', reason: 'The finder closed this report.', decidedAt: timestamp }
      })
      return { state: { ...state, listings, claims } }
    }
    default:
      throw new Error('Unknown demo action.')
  }
}
