import { useEffect, useRef } from 'react'
import { ArrowUpRight, MapPin, Navigation } from 'lucide-react'
import { buildings, campusMapSource } from '../domain/campus.js'

const width = 1000
const height = 620
const northSouthStreets = [
  [0.12, 'First St'], [0.23, 'Fourth St'], [0.365, 'Sixth St'],
  [0.493, 'Wright St'], [0.718, 'Mathews Ave'], [0.843, 'Goodwin Ave'], [0.965, 'Lincoln Ave'],
]
const eastWestStreets = [
  [0.08, 'University Ave'], [0.238, 'Stoughton St'], [0.28, 'Springfield Ave'], [0.416, 'Green St'],
  [0.629, 'Armory Ave'], [0.787, 'Gregory Dr'], [0.924, 'Peabody Dr'],
]
const streetEnds = {
  'Wright St': [0.0, 0.56, 0.75, 0.91],
  'Mathews Ave': [0.2, 0.55, 0.64, 0.95],
  'Stoughton St': [0.493, 1],
  'Armory Ave': [0, 0.49, 0.72, 1],
  'Gregory Dr': [0.225, 0.9],
}
const tintedBlocks = [
  [0.15, 0.13, 0.065, 0.055], [0.25, 0.15, 0.05, 0.08], [0.3, 0.31, 0.044, 0.063],
  [0.385, 0.115, 0.082, 0.04], [0.386, 0.178, 0.051, 0.022], [0.506, 0.12, 0.115, 0.027],
  [0.645, 0.14, 0.053, 0.09], [0.744, 0.153, 0.036, 0.078], [0.86, 0.19, 0.044, 0.063],
  [0.51, 0.295, 0.027, 0.086], [0.656, 0.285, 0.04, 0.027], [0.7, 0.343, 0.031, 0.03],
  [0.772, 0.349, 0.053, 0.038], [0.868, 0.32, 0.06, 0.052], [0.15, 0.49, 0.059, 0.081],
  [0.255, 0.46, 0.071, 0.029], [0.382, 0.445, 0.069, 0.035], [0.404, 0.521, 0.06, 0.078],
  [0.503, 0.535, 0.032, 0.072], [0.659, 0.519, 0.039, 0.07], [0.731, 0.459, 0.077, 0.071],
  [0.746, 0.566, 0.059, 0.032], [0.879, 0.501, 0.054, 0.04], [0.127, 0.679, 0.087, 0.05],
  [0.269, 0.654, 0.054, 0.096], [0.385, 0.657, 0.044, 0.058], [0.509, 0.698, 0.03, 0.055],
  [0.652, 0.662, 0.053, 0.069], [0.761, 0.667, 0.049, 0.071], [0.873, 0.646, 0.058, 0.074],
  [0.114, 0.797, 0.048, 0.072], [0.298, 0.811, 0.047, 0.08], [0.384, 0.832, 0.056, 0.055],
  [0.464, 0.82, 0.08, 0.046], [0.649, 0.812, 0.055, 0.072], [0.752, 0.816, 0.057, 0.056],
]

function draw(context, dark, compact) {
  const palette = dark
    ? { surface: '#173354', grid: '#234368', road: '#325577', block: '#284b6d', green: '#234962',
        print: '#adc2d9', water: '#456788', building: '#426081', outline: '#6785a6' }
    : { surface: '#edf1ee', grid: '#e4e9e5', road: '#fff', block: '#d8e0df', green: '#d6e6d7',
        print: '#516477', water: '#aac8dc', building: '#b7c6ce', outline: '#9aadb9' }
  const path = (points, color, size) => {
    context.beginPath()
    points.forEach(([x, y], index) => context[index ? 'lineTo' : 'moveTo'](x * width, y * height))
    context.strokeStyle = color
    context.lineWidth = size
    context.stroke()
  }
  const box = (x, y, w, h, color, radius = 3) => {
    context.fillStyle = color
    context.beginPath()
    context.roundRect(x * width, y * height, w * width, h * height, radius)
    context.fill()
  }
  context.fillStyle = palette.surface
  context.fillRect(0, 0, width, height)
  for (let i = 1; i < 40; i++) path([[i / 40, 0], [i / 40, 1]], palette.grid, 1)
  for (let i = 1; i < 25; i++) path([[0, i / 25], [1, i / 25]], palette.grid, 1)

  box(0.536, 0.514, 0.117, 0.143, palette.green, 13)
  box(0.613, 0.187, 0.079, 0.082, palette.green, 7)
  box(0.542, 0.724, 0.109, 0.056, palette.green, 10)
  box(0.139, 0.794, 0.086, 0.104, palette.green, 9)
  for (const block of tintedBlocks) box(...block, palette.block)

  for (const [x, label] of northSouthStreets) {
    const segments = streetEnds[label] ?? [0, 1]
    for (let i = 0; i < segments.length; i += 2) path([[x, segments[i]], [x, segments[i + 1]]], palette.road, 8)
  }
  for (const [y, label] of eastWestStreets) {
    const segments = streetEnds[label] ?? [0, 1]
    for (let i = 0; i < segments.length; i += 2) path([[segments[i], y], [segments[i + 1], y]], palette.road, 8)
  }
  path([[0.25, 0.34], [0.43, 0.342], [0.503, 0.325], [0.544, 0.293], [0.635, 0.291],
    [0.698, 0.256], [0.772, 0.23], [0.89, 0.214], [1, 0.175]], palette.water, 4)

  context.fillStyle = palette.print
  context.textAlign = 'left'
  context.font = `600 ${compact ? 21 : 13}px Inter Variable, sans-serif`
  for (const [y, street] of eastWestStreets) {
    if (street === 'Stoughton St' || (compact && street === 'Armory Ave')) continue
    context.fillText(street, 24, y * height - 9)
  }
  if (!compact) {
    for (const [x, street] of northSouthStreets) {
      context.save()
      context.translate(x * width + 13, height * 0.965)
      context.rotate(-Math.PI / 2)
      context.fillText(street, 0, 0)
      context.restore()
    }
  }
  context.textAlign = 'center'
  if (!compact) context.fillText('Main Quad', 595, 365)
  for (const building of buildings) {
    box(building.x - 0.025, building.y - 0.018, 0.05, 0.036, palette.building)
    context.strokeStyle = palette.outline
    context.lineWidth = 1
    context.stroke()
    context.fillStyle = palette.print
    const upperLabel = compact && building.id === 'cif'
    context.fillText(building.short, building.x * width, building.y * height + (upperLabel ? -17 : compact ? 37 : 28))
  }
}

export function CampusMap({ dark = false, children, onPick }) {
  const canvas = useRef(null)
  useEffect(() => {
    const element = canvas.current
    const context = element.getContext('2d')
    if (!context) return
    const redraw = () => draw(context, dark, element.clientWidth < 520)
    redraw()
    const resize = new ResizeObserver(redraw)
    resize.observe(element)
    return () => resize.disconnect()
  }, [dark])

  return (
    <div className={`campus-map${dark ? ' campus-map-dark' : ''}`}>
      <canvas ref={canvas} width={width} height={height} aria-hidden="true" />
      <span className="map-north" aria-label="North is up"><Navigation size={14} aria-hidden="true" /> N</span>
      {onPick && (
        <div className="map-pick-area" onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          onPick((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height)
        }} aria-hidden="true" />
      )}
      {children}
    </div>
  )
}

export function mapPosition({ x, y }) {
  return { left: `${x * 100}%`, top: `${y * 100}%` }
}

export function MapAttribution() {
  return <p className="map-source">Campus schematic · <a href={campusMapSource} target="_blank" rel="noreferrer">UIUC campus map <ArrowUpRight size={12} aria-hidden="true" /></a></p>
}

export function DecorativePins() {
  return ['cif', 'grainger', 'union', 'siebel', 'main', 'arc'].map((id) => {
    const building = buildings.find((place) => place.id === id)
    return <span key={id} className={`hero-pin hero-pin-${id}`} style={mapPosition(building)}><MapPin size={18} aria-hidden="true" /></span>
  })
}
