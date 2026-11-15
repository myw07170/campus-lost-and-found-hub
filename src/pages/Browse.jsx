import { useId, useState } from 'react'
import { ArrowRight, Grid2X2, List, Map as MapIcon, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { useDemo } from '../DemoContext.jsx'
import { CampusMap, DecorativePins, MapAttribution, mapPosition } from '../components/CampusMap.jsx'
import { BlankState, ItemCard, ItemPhoto } from '../components/ui.jsx'
import { buildings, locationLabel, locationPoint } from '../domain/campus.js'
import { categories, dateOptions, filterListings, readableDate } from '../domain/model.js'

const views = [
  { id: 'gallery', label: 'Gallery', icon: Grid2X2 },
  { id: 'list', label: 'List', icon: List },
  { id: 'map', label: 'Map', icon: MapIcon },
]

function FilterSelect({ label, placeholder, options, value, onChange }) {
  const id = useId()
  return (
    <div className="filter-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
      </select>
    </div>
  )
}

function groupMarkers(listings) {
  const groups = []
  for (const listing of listings) {
    const point = locationPoint(listing.location)
    const group = groups.find(({ x, y }) => Math.hypot((x - point.x) * 1.6, y - point.y) < 0.088)
    if (group) group.listings.push(listing)
    else groups.push({ x: point.x, y: point.y, listings: [listing] })
  }
  return groups
}

function ResultRow({ listing, detailState, compact = false }) {
  return (
    <li>
      <Link className={`result-row${compact ? ' result-row-compact' : ''}`} to={`/items/${listing.id}`} state={detailState}>
        <div className="row-photo"><ItemPhoto photo={listing.photo} alt="" /></div>
        <div className="row-info"><strong>{listing.title}</strong><span>{locationLabel(listing.location)}</span></div>
        {!compact && <time dateTime={listing.foundDate}>{readableDate(listing.foundDate)}</time>}
        <ArrowRight size={17} className="row-arrow" aria-hidden="true" />
      </Link>
    </li>
  )
}

function MapResults({ listings, detailState }) {
  const [selectedId, setSelectedId] = useState(null)
  const groups = groupMarkers(listings)
  const selected = groups.find((group) => group.listings[0].id === selectedId && group.listings.length > 1)

  return (
    <div className="map-results">
      <div className="map-results-main">
        <CampusMap>
          {groups.map(({ x, y, listings: entries }) => {
            const [first] = entries
            const position = mapPosition({ x, y })
            return entries.length === 1 ? (
              <Link className="map-marker" key={first.id} style={position} aria-label={first.title} to={`/items/${first.id}`} state={detailState}>
                <MapPin size={18} aria-hidden="true" />
              </Link>
            ) : (
              <button type="button" className="map-marker map-marker-group" key={first.id} style={position}
                aria-expanded={selected?.listings === entries} aria-controls="map-result-list"
                aria-label={`Show ${entries.length} items near ${locationLabel(first.location).replace(/^Near /, '')}`}
                onClick={() => setSelectedId((current) => current === first.id ? null : first.id)}>
                {entries.length}
              </button>
            )
          })}
        </CampusMap>
        <MapAttribution />
      </div>
      <aside className="map-result-list" id="map-result-list" aria-label="Items shown on the map">
        <div className="map-result-header">
          <h3>{selected ? `${selected.listings.length} items near this pin` : 'Items on the map'}</h3>
          {selected && <button type="button" className="icon-button" aria-label="Show all map items" onClick={() => setSelectedId(null)}><X size={18} /></button>}
        </div>
        <ul className="result-list">
          {(selected?.listings ?? listings).map((listing) => <ResultRow key={listing.id} listing={listing} compact detailState={detailState} />)}
        </ul>
      </aside>
    </div>
  )
}

export function Browse() {
  const { data } = useDemo()
  const [params, setParams] = useSearchParams()
  const currentLocation = useLocation()
  const filters = {
    query: params.get('q') ?? '',
    category: categories.some(({ id }) => id === params.get('category')) ? params.get('category') : '',
    building: buildings.some(({ id }) => id === params.get('building')) ? params.get('building') : '',
    date: dateOptions.some(({ id }) => id === params.get('date')) ? params.get('date') : '',
  }
  const view = views.some(({ id }) => id === params.get('view')) ? params.get('view') : 'gallery'
  const listings = filterListings(data.listings, filters)
  const activeFilters = Object.values(filters).some(Boolean)
  const detailState = { backTo: `/${currentLocation.search}`, backLabel: 'Back to results' }

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (!value || (key === 'view' && value === 'gallery')) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: key === 'q' })
  }

  function clearFilters() {
    setParams(view === 'gallery' ? {} : { view })
  }

  return (
    <>
      <section className="browse-hero">
        <div className="hero-copy">
          <p className="hero-kicker"><span /> UIUC CAMPUS</p>
          <h1>Lost something<br className="hero-break" /> on campus?</h1>
          <p className="hero-description">Search campus finds by building, category, or keyword, then send a claim for an item that’s yours.</p>
        </div>
        <div className="hero-map">
          <div aria-hidden="true" className="hero-map-art">
            <CampusMap dark><DecorativePins /></CampusMap>
          </div>
          <a className="hero-map-link" href="#found-items" onClick={(event) => {
            event.preventDefault()
            update('view', 'map')
            document.getElementById('found-items').scrollIntoView()
            document.getElementById('found-items').focus({ preventScroll: true })
          }}>
            <MapIcon size={19} aria-hidden="true" /> Explore the campus map <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="search-panel" aria-label="Filter found items">
        <label className="filter-field search-field">
          <span>Search items</span>
          <span className="search-input"><Search size={19} aria-hidden="true" />
            <input type="search" value={filters.query} onChange={(event) => update('q', event.target.value)} placeholder="Try “water bottle”" />
          </span>
        </label>
        <FilterSelect label="Category" placeholder="All categories" options={categories} value={filters.category} onChange={(value) => update('category', value)} />
        <FilterSelect label="Building" placeholder="All buildings" options={buildings} value={filters.building} onChange={(value) => update('building', value)} />
        <FilterSelect label="Date found" placeholder="Any date" options={dateOptions} value={filters.date} onChange={(value) => update('date', value)} />
      </section>

      <section className="found-section" id="found-items" aria-labelledby="found-heading" tabIndex={-1}>
        <div className="results-heading">
          <div>
            <h2 id="found-heading">Found items</h2>
            <div className="result-summary">
              <p role="status">{listings.length} {listings.length === 1 ? 'item' : 'items'}</p>
              {activeFilters && <button type="button" onClick={clearFilters} className="text-button">Clear filters</button>}
            </div>
          </div>
          <div className="view-switch" role="group" aria-label="Results view">
            {views.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" className={id === view ? 'selected' : ''} onClick={() => update('view', id)} aria-pressed={id === view}>
                <Icon size={17} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </div>

        {!listings.length && (
          <BlankState icon={SlidersHorizontal} title={activeFilters ? 'No items match your filters' : 'No open reports'}
            action={activeFilters && <button type="button" className="button button-secondary" onClick={clearFilters}>Clear filters</button>}>
            {activeFilters ? 'Try a different keyword or broaden your filters.' : 'Check back for the next found-item report.'}
          </BlankState>
        )}
        {listings.length > 0 && view === 'gallery' && <div className="item-grid">
          {listings.map((listing, index) => <ItemCard key={listing.id} listing={listing} detailState={detailState} eager={index < 3} />)}
        </div>}
        {listings.length > 0 && view === 'list' && <ul className="result-list result-list-full">
          {listings.map((listing) => <ResultRow key={listing.id} listing={listing} detailState={detailState} />)}
        </ul>}
        {listings.length > 0 && view === 'map' && <MapResults listings={listings} detailState={detailState} />}
      </section>
    </>
  )
}
