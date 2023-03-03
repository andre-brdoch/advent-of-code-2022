import { Logger } from '../utils/Logger.js'

import {
  Solution24,
  Coordinate,
  TimedCoordinate,
  Blizzard,
  Cell,
  Grid,
  CameFromByTurn,
} from './types'

const logger = new Logger()

const VECTORS = {
  '^': { x: 0, y: -1 },
  '>': { x: 1, y: 0 },
  'v': { x: 0, y: 1 },
  '<': { x: -1, y: 0 },
}

export default async function solution(input: string): Promise<Solution24> {
  const grid = parseGrid(input)
  logger.log('Initial blizzards')
  logger.log(stringifyGrid(grid))

  const start = getStart(grid)
  const end = getEnd(grid)
  const path1 = findPath(grid, start, end)
  const path2 = findPath(moveBlizzards(grid, path1.length - 1), end, start)
  const path3 = findPath(
    moveBlizzards(grid, path1.length + path2.length - 2),
    start,
    end
  )

  // visualize movement
  const memoizedMoveBlizzards = memoizeMoveBlizzards(grid)
  const combinedPaths = [...path1, ...path2.slice(2), ...path3.slice(2)]
  combinedPaths.forEach((coordinate, turn) => {
    const gridThatTurn = memoizedMoveBlizzards(turn)
    gridThatTurn[coordinate.y][coordinate.x] = 'E'
    logger.log(`\nEnd of turn ${turn}`)
    logger.log(stringifyGrid(gridThatTurn))
  })

  const answer1 = path1.length - 1
  const answer2 = path1.length - 1 + path2.length - 1 + path3.length - 1

  return {
    answer1,
    answer2,
    ...logger.getVisual(),
  }
}

function findPath(
  grid: Grid,
  start: Coordinate,
  end: Coordinate
): Coordinate[] {
  const frontier = new PriorityQueue<TimedCoordinate>()
  frontier.add({ ...start, turn: 0 }, 0)
  const startId = stringifyCoordinate(start)
  const cameFrom: CameFromByTurn = {
    0: {
      [startId]: null,
    },
  }
  const memoizedMoveBlizzards = memoizeMoveBlizzards(grid)

  let current: TimedCoordinate | null
  let maxTurns = 0

  while (!frontier.empty()) {
    current = frontier.get() as TimedCoordinate
    if (
      current === null ||
      stringifyCoordinate(current) === stringifyCoordinate(end)
    )
      break
    const { turn } = current
    const neighbors = [
      ...getAdjacentCoordinates(grid, current),
      // waiting is an option
      current,
    ].filter(({ x, y }) => {
      // simulate blizzards for next turn
      const blizzardGrid = memoizedMoveBlizzards(turn + 1)
      const cell = blizzardGrid[y][x]
      return cell === '.' || cell === 'E'
    })
    neighbors.forEach(next => {
      const id = stringifyCoordinate(next)
      const newTurn = turn + 1
      const turnId = `${newTurn}`
      if (!(turnId in cameFrom)) {
        cameFrom[turnId] = {}
        maxTurns += 1
      }
      if (!(id in cameFrom[turnId])) {
        const priority = newTurn + heuristic(end, next)
        frontier.add({ ...next, turn: newTurn }, priority)
        cameFrom[turnId][id] = current
      }
    })
  }

  // build path
  const path: Coordinate[] = [end]
  let key: string = stringifyCoordinate(end)

  for (let turn = maxTurns; turn > 0; turn--) {
    const next = cameFrom[turn][key]
    if (next === null) {
      break
    }
    path.push(next)
    key = stringifyCoordinate(next)
  }

  path.reverse()

  return path
}

function memoizeMoveBlizzards(grid: Grid): (turn: number) => Grid {
  let highest = 0
  const cache: { [turn: string]: Grid } = { [highest]: grid }

  return (turn: number): Grid => {
    if (!(turn in cache)) {
      const newGrid = moveBlizzards(cache[highest], Math.min(turn - highest, 1))
      highest = turn
      cache[turn] = newGrid
      return newGrid
    }
    else {
      // return copy from cache
      return cache[turn].slice().map(row => row.slice())
    }
  }
}

function moveBlizzards(grid: Grid, times = 1): Grid {
  let result: Grid = grid.slice().map(row => row.slice())

  for (let i = 0; i < times; i++) {
    const newGrid: Grid = result
      .slice()
      .map(row =>
        row.slice().map(cell => (isBlizzard(cell) || cell === 'E' ? '.' : cell))
      )

    for (let y = 0; y < result.length; y++) {
      for (let x = 0; x < result[0].length; x++) {
        const cell = result[y][x]
        if (!isBlizzard(cell)) continue
        const cells = ensureArray(cell)
        cells.forEach(blizzard => {
          const next = getNextCoordinate({ x, y }, blizzard, newGrid)
          const nextCell = newGrid[next.y][next.x]
          // next cell already occupied by blizzard(s)
          if (isBlizzard(nextCell)) {
            newGrid[next.y][next.x] = [...ensureArray(nextCell), blizzard]
          }
          else newGrid[next.y][next.x] = blizzard
        })
      }
    }
    result = newGrid
  }
  return result
}

function getNextCoordinate(
  coordinate: Coordinate,
  blizzard: Blizzard,
  grid: Grid,
  warp = true
): Coordinate {
  let nextCell: Cell | undefined = undefined
  let next = { ...coordinate }
  const vector = VECTORS[blizzard]
  while (nextCell === undefined || nextCell === '#') {
    next = {
      x: vector.x + next.x,
      y: vector.y + next.y,
    }

    // when not warping, allow returning off-grid coordinates
    if (!warp && !isOnGrid(grid, next)) return next

    nextCell = grid[next.y][next.x]

    // warp through walls
    if (warp && nextCell === '#') {
      nextCell = grid[next.y][next.x]
      const axis = ['<', '>'].includes(blizzard) ? 'x' : 'y'
      const forwards = ['>', 'v'].includes(blizzard)
      if (forwards) next[axis] = 0
      else {
        if (axis === 'y') next[axis] = grid.length - 1
        else next[axis] = grid[0].length - 1
      }
    }
  }
  return next
}

function getAdjacentCoordinates(
  grid: Grid,
  coordinate: Coordinate
): Coordinate[] {
  return (['^', '>', 'v', '<'] as Blizzard[])
    .map(blizzard => getNextCoordinate(coordinate, blizzard, grid, false))
    .filter(coordinate => isOnGrid(grid, coordinate))
}

function isBlizzard(cell: Cell): cell is Blizzard {
  if (Array.isArray(cell)) {
    return cell.every(isBlizzard)
  }
  return ['^', '>', 'v', '<'].includes(cell)
}

function stringifyGrid(grid: Grid): string {
  let string = '\n'
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
      let sign: Cell | number = grid[x][y]
      if (Array.isArray(sign)) sign = sign.length
      string += sign
    }
    string += '\n'
  }
  return string
}

function heuristic(a: Coordinate, b: Coordinate): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function isOnGrid(grid: Grid, coordinate: Coordinate): boolean {
  const { x, y } = coordinate
  try {
    return !!grid[y][x]
  }
  catch (err) {
    return false
  }
}

function ensureArray<T>(item: T | T[]): T[] {
  if (Array.isArray(item)) return item
  return [item]
}

function getStart(grid: Grid): Coordinate {
  const y = 0
  const x = grid[y].indexOf('.')
  if (x === -1) throw new Error('No start found')
  return { x, y }
}

function getEnd(grid: Grid): Coordinate {
  const y = grid.length - 1
  const x = grid[y].indexOf('.')
  if (x === -1) throw new Error('No end found')
  return { x, y }
}

function stringifyCoordinate(coordinate: Coordinate): string {
  const { x, y } = coordinate
  return `${x}/${y}`
}

function parseGrid(input: string): Grid {
  return input.split('\n').map(line => line.split('') as Cell[])
}

interface PriorityQueueItem<T> {
  item: T
  priority: number
}

class PriorityQueue<T> {
  private items: PriorityQueueItem<T>[]

  constructor() {
    this.items = []
  }

  public add(item: T, priority: number): void {
    this.items.push({ item, priority })
  }

  public get(): T | null {
    if (this.empty()) return null
    // low to high
    const highestPrio = this.items.sort((a, b) => a.priority - b.priority)[0]
    const i = this.items.indexOf(highestPrio)
    this.items.splice(i, 1)
    return highestPrio.item
  }

  public empty(): boolean {
    return this.items.length === 0
  }
}
