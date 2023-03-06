import { SolutionFn } from '../types'
import {
  Coordinate,
  MainDirections,
  Direction,
  Elf,
  ElfLocation,
  EmptyLocation,
  Movement,
  Grid,
  GridArray,
  Axis,
} from './types'
import { Logger } from '../utils/Logger.js'
import { parseArgs } from '../utils/env-helpers.js'

const { noLog, visualize } = parseArgs()

const CHECK_AFTER = 10
const logger = new Logger()

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
const DIRECTION_ARCS: { [key: string]: Direction[] } = {
  N: ['NE', 'N', 'NW'],
  W: ['NW', 'W', 'SW'],
  S: ['SW', 'S', 'SE'],
  E: ['NE', 'E', 'SE'],
}

export default (async function solution(input) {
  const grid = parseFile(input)
  const directionPriorities: MainDirections[] = ['N', 'S', 'W', 'E']

  logger.log('\n\n=== Initial State ===')
  logger.log(stringifyGrid(grid))

  moveElves(grid, directionPriorities, CHECK_AFTER)

  const answer1 = countEmptyLocations(grid)

  // keep moving till done
  const turns = moveElves(grid, directionPriorities, null)
  const answer2 = CHECK_AFTER + (turns as number) - 1

  return { answer1, answer2, visuals: [logger.getVisual()] }
} satisfies SolutionFn)

function moveElves(
  grid: Grid,
  directionPriorities: MainDirections[],
  times: number | null
): number | false {
  let counter = 1
  let didFinish = false
  while (times === null ? !didFinish : counter <= times) {
    counter += 1

    const targetMovements: Movement[] = []
    const elves = getAllElfLocations(grid)

    // find all elves that are not in final position yet
    const movableElveLocations = elves.filter(
      elfLocation =>
        getAdjacent(grid, elfLocation, 'all').filter(location => location)
          .length
    )

    if (movableElveLocations.length === 0) {
      // all elves are in final position
      didFinish = true
      break
    }

    // get target locations for all elves
    movableElveLocations.forEach(location => {
      for (let j = 0; j < directionPriorities.length; j++) {
        const direction = directionPriorities[j]
        const neighborElves = getAdjacent(grid, location, direction).filter(
          location => location
        )

        if (neighborElves.length === 0) {
          // is free, can move
          const target = moveToDirection(location, direction)
          targetMovements.push({ from: location, to: target as ElfLocation })
          break
        }
      }
    })

    // keep track of location targeted by multiple elves
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

    // rotate direction priorities
    directionPriorities.push(directionPriorities.shift() as MainDirections)

    logger.log(stringifyGrid(grid))
  }
  return didFinish ? counter : false
}

function getAllElfLocations(grid: Grid): ElfLocation[] {
  return Object.keys(grid).flatMap(y =>
    Object.keys(grid[y]).map(x => ({
      x: Number(x),
      y: Number(y),
      elf: grid[y][x],
      type: 'elf',
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

function countEmptyLocations(grid: Grid): number {
  return arrifyGrid(grid)
    .flat()
    .filter(location => location.type === 'empty').length
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

function arrifyGrid(grid: Grid): GridArray {
  const elves = getAllElfLocations(grid)
  const xMin = getExtremeCoordinate(elves, 'x', 'min')
  const xMax = getExtremeCoordinate(elves, 'x', 'max')
  const yMin = getExtremeCoordinate(elves, 'y', 'min')
  const yMax = getExtremeCoordinate(elves, 'y', 'max')

  const result: GridArray = []
  for (let y = yMin; y <= yMax; y++) {
    const row: (ElfLocation | EmptyLocation)[] = []
    for (let x = xMin; x <= xMax; x++) {
      const elf = grid[y]?.[x]
      const location: ElfLocation | EmptyLocation = elf
        ? { x, y, elf, type: 'elf' }
        : { x, y, type: 'empty' }
      row.push(location)
    }
    result.push(row)
  }
  return result
}

function stringifyGrid(grid: Grid): string {
  if (noLog && !visualize) return ''
  const elves = getAllElfLocations(grid)
  const xMin = getExtremeCoordinate(elves, 'x', 'min')
  const xMax = getExtremeCoordinate(elves, 'x', 'max')
  const yMin = getExtremeCoordinate(elves, 'y', 'min')
  const yMax = getExtremeCoordinate(elves, 'y', 'max')

  let string = '\n\n'
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      // rotate 180 deg
      const marker = grid[yMax - y + yMin]?.[x] ? '#' : '.'
      string += marker + ' '
    }
    string += '\n'
  }
  return string
}

function getExtremeCoordinate(
  coordinates: Coordinate[],
  axis: Axis,
  type: 'min' | 'max'
): number {
  return coordinates
    .map(c => c[axis])
    .sort((a, b) => (type === 'min' ? a - b : b - a))[0]
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
        addToGrid(grid, { elf, x, y, type: 'elf' })
      })
    )
  return grid
}
