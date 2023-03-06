import { SolutionFn } from '../types'
import { Cell, CaveGrid, Coordinates, Axis, Path } from './types'
import { Logger } from '../utils/Logger.js'
import { parseArgs } from '../utils/env-helpers.js'

const SAND_START: Coordinates = { x: 500, y: 0 }

const { noLog, visualize } = parseArgs()

const loggers = [
  new Logger({ outputName: 'output-1.txt' }),
  new Logger({ outputName: 'output-2.txt' }),
]
let logger = loggers[0]

export default (async function solution(input) {
  const cornerPaths = parsePaths(input)

  const answer1 = getAnswer1(cornerPaths, SAND_START)
  logger = loggers[1]
  const answer2 = getAnswer2(cornerPaths, SAND_START)

  return {
    answer1,
    answer2,
    visuals: loggers.slice(0, 1).map(l => l.getVisual()),
  }
} satisfies SolutionFn)

function getAnswer1(cornerPaths: Path[], sandStart: Coordinates): number {
  const cave = new Cave(cornerPaths, sandStart)
  logger.log(cave.toString())
  const result = cave.fillSand()
  return result
}

function getAnswer2(cornerPaths: Path[], sandStart: Coordinates): number {
  const cave = new Cave(cornerPaths, sandStart, true)
  logger.log(cave.toString())
  const result = cave.fillSand()
  return result
}

class Cave {
  public grid: CaveGrid
  private paths: Path[]
  public sandStart: Coordinates
  private withFloor: boolean

  constructor(cornerPaths: Path[], sandStart: Coordinates, withFloor = false) {
    const {
      paths: cornerPathsNormalized,
      offsetX,
      offsetY,
    } = normalizePaths(cornerPaths)

    this.paths = cornerPathsNormalized.map(fillPath)
    this.sandStart = {
      x: sandStart.x + offsetX,
      y: sandStart.y + offsetY,
    }
    this.withFloor = withFloor
    this.grid = this.getInitialCave()
  }

  public fillSand(): number {
    this.grid[this.sandStart.x][this.sandStart.y] = '+'

    let count = 0
    let notFullYet = true
    while (notFullYet) {
      count += 1
      notFullYet = this.addSandUnit()
    }
    return count - 1
  }

  public addSandUnit(): boolean {
    const target: Coordinates = this.getNextSandPosition(this.sandStart)
    if (!this.isInCave(target) || this.sandIsBlocked()) {
      return false
    }
    this.grid[target.x][target.y] = 'o'
    logger.log(`${this.toString()}\n\n`)
    return true
  }

  private getNextSandPosition(sandCoordinates: Coordinates): Coordinates {
    if (!this.withFloor && !this.isInCave(sandCoordinates)) {
      return sandCoordinates
    }
    this.increaseGridIfNecessary(sandCoordinates)

    const bottom: Coordinates = { ...sandCoordinates, y: sandCoordinates.y + 1 }
    const bottomLeft: Coordinates = { ...bottom, x: bottom.x - 1 }
    const bottomRight: Coordinates = { ...bottom, x: bottom.x + 1 }

    const nextPosition = this.isFree(bottom)
      ? bottom
      : this.isFree(bottomLeft)
        ? bottomLeft
        : this.isFree(bottomRight)
          ? bottomRight
          : undefined

    if (nextPosition) {
      return this.getNextSandPosition(nextPosition)
    }
    return sandCoordinates
  }

  private increaseGridIfNecessary(target: Coordinates): void {
    if (!this.withFloor) return

    const onLeftEdge = target.x === 0
    const onRightEdge = target.x === this.grid.length - 1

    if (!onLeftEdge && !onRightEdge) {
      return
    }

    const newRow = this.grid[0].map((cell, i) =>
      i === this.grid[0].length - 1 ? '#' : '.'
    )

    // increase to the left, and adjust coordinates
    if (onLeftEdge) {
      this.grid = [newRow, ...this.grid]
      target.x += 1
      this.sandStart.x += 1
    }
    // increase to the right
    else if (onRightEdge) {
      this.grid = [...this.grid, newRow]
    }
  }

  public isInCave(coordinates: Coordinates): boolean {
    const { x, y } = coordinates
    return 0 <= x && x < this.grid.length && 0 <= y && y < this.grid[0].length
  }

  public isFree(coordinates: Coordinates): boolean {
    if (!this.isInCave(coordinates)) {
      // outside of cave always counts as free
      return true
    }
    const { x, y } = coordinates
    return cellIsFree(this.grid[x][y])
  }

  public sandIsBlocked(): boolean {
    return this.grid[this.sandStart.x][this.sandStart.y] === 'o'
  }

  public toString(): string {
    if (noLog && !visualize) return ''
    let string = ''
    for (let i = 0; i < this.grid[0].length; i++) {
      if (string.length) string += '\n'
      for (let j = 0; j < this.grid.length; j++) {
        string += this.grid[j][i] + ' '
      }
    }
    return string
  }

  private getInitialCave(): CaveGrid {
    const flatCoordinates = this.paths.flat()
    const width = getExtremeCoordinate(flatCoordinates, 'x', 'max') + 1
    const height = getExtremeCoordinate(flatCoordinates, 'y', 'max') + 1
    const cave: CaveGrid = Array.from(Array(width)).map(() =>
      Array.from(Array(height)).map(() => '.')
    )
    this.paths.forEach(path =>
      path.forEach(({ x, y }) => {
        cave[x][y] = '#'
      })
    )
    if (this.withFloor) {
      // add floor 2 fields above previous highest point
      cave.forEach(row => {
        row.push('.')
        row.push('#')
      })
    }
    return cave
  }
}

/** Adjust coordinate range to start from 0/0 */
function normalizePaths(paths: Path[]): {
  paths: Path[]
  offsetX: number
  offsetY: number
} {
  // include sand start coordinates:
  const flatCoordinates = [...paths.flat(), SAND_START]
  const xMin = getExtremeCoordinate(flatCoordinates, 'x', 'min')
  const yMin = getExtremeCoordinate(flatCoordinates, 'y', 'min')
  const normalizePaths = paths.map(path =>
    path.map(({ x, y }) => ({ x: x - xMin, y: y - yMin }))
  )
  return {
    paths: normalizePaths,
    offsetX: -xMin,
    offsetY: -yMin,
  }
}

function getExtremeCoordinate(
  coordinates: Coordinates[],
  axis: Axis,
  type: 'min' | 'max'
): number {
  return coordinates
    .map(c => c[axis])
    .sort((a, b) => (type === 'min' ? a - b : b - a))[0]
}

function cellIsFree(cell: Cell): boolean {
  return ['.', '+'].includes(cell)
}

/** Fills in all gaps in path with coordinates */
function fillPath(path: Path): Path {
  return path.reduce((result, pair, i, array) => {
    if (i === 0) return [pair]
    const prevPair = array[i - 1]
    const vector: Coordinates = {
      x: pair.x - prevPair.x,
      y: pair.y - prevPair.y,
    }
    const axis: Axis = vector.x !== 0 ? 'x' : 'y'
    const fillerPairs = getNumbersBetween(prevPair[axis], pair[axis]).map(
      number => ({
        ...pair,
        [axis]: number,
      })
    )
    return [...result, ...fillerPairs, pair]
  }, [] as Path)
}

function getNumbersBetween(a: number, b: number): number[] {
  const between: number[] = []
  const max = Math.max(a, b)
  let min = Math.min(a, b)
  if (max - min <= 1) return between
  while (min < max - 1) {
    min = min + 1
    between.push(min)
  }
  if (max === a) between.reverse()
  return between
}

function parsePaths(input: string): Path[] {
  return input.split('\n').map(line =>
    line.split(' -> ').map(coordinatesString => {
      const [x, y] = coordinatesString.split(',')
      return { x: Number(x), y: Number(y) }
    })
  )
}
