import { daysBefore, todayOnCampus } from './model.js'

const items = [
  ['bottle', 'Blue metal water bottle', 'accessories', 'grainger', 'avery', 0,
    'Found on a second-floor study table near the windows. It has a black carry-loop cap.',
    'What marking is on the bottom of the bottle?'],
  ['earbuds', 'Black wireless earbuds', 'electronics', 'union', 'jordan', 1,
    'Found in a charging case near the first-floor seating area.',
    'What name do the earbuds show when paired?'],
  ['keys', 'Keys on a navy lanyard', 'keys', 'siebel', 'avery', 2,
    'A small set of keys found by the west entrance.',
    'What does the small tag on the key ring say?'],
  ['notebook', 'Red pocket notebook', 'school', 'main', 'avery', 3,
    'Found beside a reading-room chair. The cover is red fabric.',
    'What is written inside the front cover?'],
  ['cap', 'Olive green baseball cap', 'clothing', 'arc', 'jordan', 4,
    'Found on a bench near the lobby after open gym.',
    'What initials are written on the inside label?'],
  ['charger', 'USB-C charger and cable', 'electronics', 'cif', 'avery', 5,
    'A white wall adapter and cable found at a study counter.',
    'How is the cable marked near one of the ends?'],
  ['umbrella', 'Black folding umbrella', 'accessories', 'grainger', 'jordan', 8,
    'Left near the south entrance on a rainy afternoon.',
    'What does the tag on the carry sleeve look like?'],
  ['pouch', 'Tan pencil pouch', 'school', 'ece', 'avery', 16,
    'A zippered canvas pouch found outside a classroom.',
    'Name two things inside the pouch.'],
  ['gloves', 'Gray knit gloves', 'clothing', 'foellinger', 'jordan', 34,
    'A pair found on the steps after an evening event.',
    'What pattern is on the inside of the cuffs?'],
]

export function seedDemo(now = new Date()) {
  const today = todayOnCampus(now)
  const listings = items.map(([id, title, category, buildingId, finderId, age, description, question]) => {
    const foundDate = daysBefore(today, age)
    return {
      id, title, category, finderId, description, question, foundDate, status: 'open',
      createdAt: `${foundDate}T20:00:00.000Z`,
      photo: { sample: id },
      location: { buildingId },
    }
  })
  return {
    listings,
    claims: [{
      id: 'notebook-claim', listingId: 'notebook', claimantId: 'jordan', status: 'pending',
      question: listings.find(({ id }) => id === 'notebook').question,
      answer: 'My initials, JL, and the course number CS 409.',
      createdAt: `${daysBefore(today, 1)}T19:00:00.000Z`,
    }],
  }
}
