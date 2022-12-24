interface Solution23 {
  answer1: number
}
interface Coordinate {
  x: number
  y: number
}
type MainDirections = 'N' | 'S' | 'E' | 'W'
type Direction = 'N' | 'S' | 'E' | 'W' | 'NW' | 'NE' | 'SW' | 'SE'
interface Vector extends Coordinate {
  name: Direction
}
interface Elf {
  moveTo?: Coordinate
  name: string
}
interface ElfLocation extends Coordinate {
  elf: Elf
}
interface Movement {
  from: ElfLocation
  to: ElfLocation
}
// map to look up elfs via y/x coordinates
interface Grid {
  [key: string]: {
    [key: string]: Elf
  }
}

const VECTORS: { [key: string]: Coordinate } = {
  N: { x: 0, y: 1 },
  NE: { x: 1, y: 1 },
  E: { x: 1, y: 0 },
  SE: { x: 1, y: -1 },
  S: { x: 0, y: -1 },
  SW: { x: -1, y: -1 },
  W: { x: -1, y: 0 },
  NW: { x: -1, y: 1 },
}
const DIRECTION_ARCS_OLD: { [key: string]: Coordinate[] } = {
  N: [VECTORS.NE, VECTORS.N, VECTORS.NW],
  W: [VECTORS.NW, VECTORS.W, VECTORS.SW],
  S: [VECTORS.SW, VECTORS.S, VECTORS.SE],
  E: [VECTORS.NE, VECTORS.E, VECTORS.SE],
}
const DIRECTION_ARCS: { [key: string]: Direction[] } = {
  N: ['NE', 'N', 'NW'],
  W: ['NW', 'W', 'SW'],
  S: ['SW', 'S', 'SE'],
  E: ['NE', 'E', 'SE'],
}

export default async function solution(input: string): Promise<Solution23> {
  console.log(input)

  const grid = parseFile(input)
  const directionPriorities: MainDirections[] = ['N', 'S', 'W', 'E']

  console.log(grid)
  moveElves(grid, directionPriorities)
  console.log(grid)

  // console.log('test locations')
  // const l = getAllElfLocations(grid)[0]
  // console.log(l)
  // console.log(getAdjacent(grid, l, 'N'))

  return { answer1: 0 }
}

function moveElves(grid: Grid, directionPriorities: MainDirections[]): void {
  const targetGrid: { [key: string]: { [key: string]: Elf[] } } = {}
  const targetMovements: Movement[] = []
  const elves = getAllElfLocations(grid)
  const movableElveLocations = elves.filter(elfLocation =>
    getAdjacent(grid, elfLocation, 'all').filter(location => location)
  )
  // console.log('movableElves')
  // console.log(movableElveLocations)

  movableElveLocations.forEach(location => {
    console.log('---')

    for (let i = 0; i < directionPriorities.length; i++) {
      const direction = directionPriorities[i]
      const neighborElves = getAdjacent(grid, location, direction).filter(
        location => location
      )
      console.log(
        `${location.elf.name} looking ${direction}: ${neighborElves.length} neighbors.`
      )

      if (neighborElves.length === 0) {
        // is free, can move
        const target = moveToDirection(location, direction)
        targetMovements.push({ from: location, to: target as ElfLocation })
        // if (!(target.y in targetGrid)) {
        //   targetGrid[target.y] = { [target.x]: [location.elf] }
        // }
        // else if (!(target.x in targetGrid[target.y])) {
        //   targetGrid[target.y][target.x] = [location.elf]
        // }
        // else targetGrid[target.y][target.x].push(location.elf)
        break
      }
    }
  })

  // Object.keys(targetGrid).forEach(y => y)

  directionPriorities.push(directionPriorities.shift() as MainDirections)
  console.log('new prios:', directionPriorities)

  console.log(targetMovements)

  const countMap: { [key: string]: number } = {}
  targetMovements.forEach(({ to }) => {
    const id = stringifyCoordinate(to)
    if (!(id in countMap)) countMap[id] = 1
    else countMap[id] += 1
  })

  // move if no other elf targeted the same field
  targetMovements
    .filter(({ to }) => countMap[stringifyCoordinate(to)] === 1)
    .forEach(({ from, to }) => {
      addToGrid(grid, to)
      removeFromGrid(grid, from)
    })
}

function getAllElfLocations(grid: Grid): ElfLocation[] {
  return Object.keys(grid).flatMap(y =>
    Object.keys(grid[y]).map(x => ({
      x: Number(x),
      y: Number(y),
      elf: grid[y][x],
    }))
  )
}

function moveToDirection(
  location: Coordinate | ElfLocation,
  direction: Direction
): Coordinate | ElfLocation {
  const { x, y } = location
  const vector = VECTORS[direction]
  return { ...location, x: x + vector.x, y: y + vector.y }
}

function getAdjacent(
  grid: Grid,
  coordinate: Coordinate,
  direction: MainDirections | 'all'
): (Elf | undefined)[] {
  const directions: Direction[] =
    direction !== 'all'
      ? DIRECTION_ARCS[direction]
      : (Object.keys(VECTORS) as Direction[])
  return directions
    .map(d => moveToDirection(coordinate, d))
    .map(c => grid[c.y]?.[c.x])
}

function addToGrid(grid: Grid, elfLocation: ElfLocation): void {
  const { x, y, elf } = elfLocation
  if (!(y in grid)) {
    grid[y] = { [x]: elf }
  }
  else {
    grid[y][x] = elf
  }
}

function removeFromGrid(grid: Grid, elfLocation: ElfLocation): void {
  const { x, y } = elfLocation
  delete grid[y][x]
  if (Object.keys(grid[y]).length === 0) {
    delete grid[y]
  }
}

function stringifyCoordinate(coordinate: Coordinate): string {
  return `${coordinate.x}/${coordinate.y}`
}

function parseFile(input: string): Grid {
  const grid: Grid = {}
  const elves: Elf[] = []

  input
    .split('\n')
    .reverse()
    .forEach((line, y) =>
      line.split('').forEach((char, x) => {
        if (char === '.') return
        const elf: Elf = { name: `#${x}/${y}` }
        elves.push(elf)
        addToGrid(grid, { elf, x, y })
      })
    )
  return grid
}
