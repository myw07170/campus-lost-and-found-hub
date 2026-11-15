// Relative positions and simplified street geometry based on the Illinois F&S campus map.
export const campusMapSource = 'https://docs.fs.illinois.edu/wp-content/uploads/2025/03/AP0001_M014-UI-Campus-Map-formerly-GIS_148.pdf'

export const buildings = [
  { id: 'arc', name: 'Activities and Recreation Center', short: 'ARC', x: 0.245, y: 0.872 },
  { id: 'cif', name: 'Campus Instructional Facility', short: 'CIF', x: 0.529, y: 0.322 },
  { id: 'ece', name: 'Electrical and Computer Engineering Building', short: 'ECE', x: 0.57, y: 0.194 },
  { id: 'foellinger', name: 'Foellinger Auditorium', short: 'Foellinger', x: 0.6, y: 0.684 },
  { id: 'grainger', name: 'Grainger Engineering Library', short: 'Grainger', x: 0.59, y: 0.332 },
  { id: 'union', name: 'Illini Union', short: 'Illini Union', x: 0.592, y: 0.476 },
  { id: 'main', name: 'Main Library', short: 'Main Library', x: 0.469, y: 0.756 },
  { id: 'siebel', name: 'Siebel Center for Computer Science', short: 'Siebel CS', x: 0.784, y: 0.203 },
]

export const buildingById = Object.fromEntries(buildings.map((building) => [building.id, building]))

export function nearestBuilding(x, y) {
  return buildings.reduce((nearest, building) => {
    const distance = (point) => ((point.x - x) * 1.6) ** 2 + (point.y - y) ** 2
    return distance(building) < distance(nearest) ? building : nearest
  })
}

export function locationLabel(location) {
  const building = buildingById[location.buildingId]
  return location.pin ? `Near ${building.name}` : building.name
}

export function locationPoint(location) {
  return location.pin ?? buildingById[location.buildingId]
}
