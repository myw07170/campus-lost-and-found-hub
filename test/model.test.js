import test from 'node:test'
import assert from 'node:assert/strict'
import { buildingById } from '../src/domain/campus.js'
import { canClaim, changeDemo, claimsFor, draftErrors, filterListings, handoffContact } from '../src/domain/model.js'
import { seedDemo } from '../src/domain/seed.js'

const now = new Date('2026-11-15T20:00:00Z')
const today = '2026-11-15'

const lookup = (state, id) => state.listings.find((listing) => listing.id === id)
const act = (state, action, actor, newId = 'new-demo-record') => changeDemo(state, action, actor, now, () => newId)

function claimBottle(state) {
  return act(state, {
    type: 'claim', listingId: 'bottle', question: lookup(state, 'bottle').question, answer: 'Blue initials on the bottom.',
  }, 'jordan').state
}

test('keyword, category, building, and date filters compose and exclude unavailable items', () => {
  const { listings } = seedDemo(now)
  const filters = { query: '  bLaCk  umbrella ', category: 'accessories', building: 'grainger', date: '30' }
  assert.deepEqual(filterListings(listings, filters, today).map(({ id }) => id), ['umbrella'])
  assert.deepEqual(filterListings(listings, { ...filters, date: '7' }, today), [])
  assert.deepEqual(filterListings(listings, { ...filters, category: 'electronics' }, today), [])
  assert.deepEqual(filterListings(listings, { ...filters, building: 'union' }, today), [])
  assert.deepEqual(filterListings(listings.map((item) => ({ ...item, status: 'returned' })), {}, today), [])
})

test('private answers belong to the claimant and finder, and contact appears only after approval', () => {
  const seed = seedDemo(now)
  const listing = lookup(seed, 'notebook')
  const [claim] = seed.claims
  assert.deepEqual(claimsFor(seed, null), [])
  assert.deepEqual(claimsFor(seed, 'unrelated'), [])
  assert.deepEqual(claimsFor(seed, 'avery'), [claim])
  assert.deepEqual(claimsFor(seed, 'jordan'), [claim])
  assert.equal(handoffContact(listing, claim, 'avery'), null)
  assert.equal(handoffContact(listing, claim, 'jordan'), null)
  const approved = { ...claim, status: 'approved' }
  assert.equal(handoffContact(listing, approved, 'avery').contact, 'jordan@example.test')
  assert.equal(handoffContact(listing, approved, 'jordan').contact, 'avery@example.test')
  assert.equal(handoffContact(listing, approved, null), null)
  assert.equal(handoffContact(lookup(seed, 'bottle'), approved, 'avery'), null)
})

test('guests, finders, and repeat claimants cannot submit a claim', () => {
  const seed = seedDemo(now)
  const listing = lookup(seed, 'bottle')
  const action = { type: 'claim', listingId: listing.id, question: listing.question, answer: 'An identifying detail.' }
  assert.throws(() => act(seed, action, null), /demo account/)
  assert.throws(() => act(seed, action, 'avery'), /unavailable/)
  assert.throws(() => act(claimBottle(seed), action, 'jordan'), /unavailable/)
  assert.throws(() => act(seed, { ...action, question: 'Outdated question' }, 'jordan'), /updated/)
  assert.throws(() => act(seed, { ...action, answer: '    ' }, 'jordan'), /Enter an answer/)
})

test('approval ends other pending claims, pauses the listing, and enables a finder-only return', () => {
  let state = claimBottle(seedDemo(now))
  const competing = { ...state.claims.at(-1), id: 'competitor', claimantId: 'other' }
  state = { ...state, claims: [...state.claims, competing] }
  const approve = { type: 'approve', listingId: 'bottle', claimId: 'new-demo-record' }
  const giveBack = { type: 'return', listingId: 'bottle' }
  assert.throws(() => act(state, giveBack, 'avery'), /current status/)
  assert.throws(() => act(state, approve, 'jordan'), /Only the finder/)
  state = act(state, approve, 'avery').state
  assert.equal(state.claims.find(({ id }) => id === 'new-demo-record').status, 'approved')
  assert.equal(state.claims.find(({ id }) => id === 'competitor').status, 'rejected')
  assert.equal(state.claims.find(({ id }) => id === 'notebook-claim').status, 'pending')
  assert.equal(lookup(state, 'bottle').status, 'awaiting-return')
  assert.equal(canClaim(state, lookup(state, 'bottle'), 'jordan'), false)
  assert.throws(() => act(state, approve, 'avery'), /pending claim/)
  assert.throws(() => act(state, giveBack, 'jordan'), /current status/)
  state = act(state, giveBack, 'avery').state
  assert.equal(lookup(state, 'bottle').status, 'returned')
  assert.equal(canClaim(state, lookup(state, 'bottle'), 'jordan'), false)
})

test('rejection leaves a report open and closing a report resolves its pending claims', () => {
  const seed = seedDemo(now)
  const action = { type: 'reject', listingId: 'notebook', claimId: 'notebook-claim' }
  const rejected = act(seed, action, 'avery').state
  assert.equal(lookup(rejected, 'notebook').status, 'open')
  assert.equal(rejected.claims[0].status, 'rejected')
  assert.equal(handoffContact(lookup(rejected, 'notebook'), rejected.claims[0], 'jordan'), null)
  const close = { type: 'close', listingId: 'notebook' }
  assert.throws(() => act(seed, close, 'jordan'), /current status/)
  const closed = act(seed, close, 'avery').state
  assert.equal(lookup(closed, 'notebook').status, 'closed')
  assert.equal(closed.claims[0].status, 'rejected')
})

test('publishing validates the form, stores the pin, and only the finder can edit the report', () => {
  const seed = seedDemo(now)
  const { x, y } = buildingById.siebel
  const draft = { ...lookup(seed, 'notebook'), title: '  Demo pencil case  ', location: { buildingId: 'main', pin: { x, y } } }
  const action = { type: 'publish', draft }
  assert.deepEqual(Object.keys(draftErrors({ ...draft, title: '', photo: null, foundDate: '2026-02-30' }, today)),
    ['title', 'photo', 'foundDate'])
  const { state, result } = act(seed, action, 'jordan')
  const published = lookup(state, result)
  assert.equal(published.finderId, 'jordan')
  assert.equal(published.title, 'Demo pencil case')
  assert.deepEqual(published.location, { buildingId: 'siebel', pin: { x, y } })
  const edit = { type: 'edit', listingId: result, draft: { ...published, question: 'What is inside?' } }
  assert.throws(() => act(state, edit, 'avery'), /Only the finder/)
  assert.equal(lookup(act(state, edit, 'jordan').state, result).question, 'What is inside?')
})
