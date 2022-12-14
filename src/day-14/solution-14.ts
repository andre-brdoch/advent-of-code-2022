interface Solution14 {
  answer1: number
  answer2: number
}
type Air = '.'
type Rock = '#'
type Sand = 'o'
type SandStart = '+'
type Cell = Air | Rock | Sand | SandStart
type Cave = Cell[][]
interface Coordinates {
  x: number
  y: number
}
type Axis = keyof Coordinates
type Path = Coordinates[]

const SAND_START: Coordinates = { x: 500, y: 0 }

export default async function solution(input: string): Promise<Solution14> {
  const cornerPaths = parsePaths(input)
  const {
    paths: cornerPathsNormalized,
    offsetX,
    offsetY,
  } = normalizePaths(cornerPaths)
  const sandStartNormalized: Coordinates = {
    x: SAND_START.x + offsetX,
    y: SAND_START.y + offsetY,
  }
  const paths = cornerPathsNormalized.map(fillPath)

  const answer1 = getAnswer1(paths, sandStartNormalized)
  const answer2 = getAnswer2(paths, sandStartNormalized)

  return { answer1, answer2 }
}

function getAnswer1(normalizePaths: Path[], sandStart: Coordinates): number {
  const cave = getCave(normalizePaths)
  return fillSand(cave, sandStart)
}

function getAnswer2(normalizePaths: Path[], sandStart: Coordinates): number {
  const cave = getCave(normalizePaths, true)
  printCave(cave)
  const result = fillSand(cave, sandStart, false)
  printCave(cave)
  return result
}

function fillSand(
  cave: Cave,
  sandStart: Coordinates,
  withFloor = false
): number {
  cave[sandStart.x][sandStart.y] = '+'

  let count = 0
  let notFullYet = true
  while (notFullYet) {
    count += 1
    notFullYet = addSandUnit(cave, sandStart, withFloor)
  }
  return count - 1
}

function addSandUnit(
  cave: Cave,
  sandStart: Coordinates,
  withFloor = false
): boolean {
  const target: Coordinates = getNextSandPosition(cave, sandStart)
  if (!isInCave(cave, target)) {
    if (!withFloor) {
      return false
    }
    else {
      // increase cave
    }
  }
  cave[target.x][target.y] = 'o'
  return true
}

function getNextSandPosition(
  cave: Cave,
  sandCoordinates: Coordinates
): Coordinates {
  if (!isInCave(cave, sandCoordinates)) return sandCoordinates

  const bottom: Coordinates = { ...sandCoordinates, y: sandCoordinates.y + 1 }
  const bottomLeft: Coordinates = { ...bottom, x: bottom.x - 1 }
  const bottomRight: Coordinates = { ...bottom, x: bottom.x + 1 }

  const nextPosition = isFree(cave, bottom)
    ? bottom
    : isFree(cave, bottomLeft)
      ? bottomLeft
      : isFree(cave, bottomRight)
        ? bottomRight
        : undefined

  if (nextPosition) {
    return getNextSandPosition(cave, nextPosition)
  }
  return sandCoordinates
}

function getCave(normalizedRockPaths: Path[], withFloor = false): Cave {
  const flatCoordinates = normalizedRockPaths.flat()
  const width = getExtremeCoordinate(flatCoordinates, 'x', 'max') + 1
  const height = getExtremeCoordinate(flatCoordinates, 'y', 'max') + 1
  const cave: Cave = Array.from(Array(width)).map(() =>
    Array.from(Array(height)).map(() => '.')
  )

  normalizedRockPaths.forEach(path =>
    path.forEach(({ x, y }) => {
      cave[x][y] = '#'
    })
  )

  if (withFloor) {
    // add floor 2 fields above previous highest point
    cave.forEach(row => {
      row.push('.')
      row.push('#')
    })
  }

  return cave
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

function isInCave(cave: Cave, coordinates: Coordinates): boolean {
  const { x, y } = coordinates
  return 0 <= x && x < cave.length && 0 <= y && y < cave[0].length
}

function isFree(cave: Cave, coordinates: Coordinates): boolean {
  if (!isInCave(cave, coordinates)) {
    // outside of cave always counts as free
    return true
  }
  const { x, y } = coordinates
  return cellIsFree(cave[x][y])
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

function printCave(cave: Cave): void {
  let string = ''
  for (let i = 0; i < cave[0].length; i++) {
    string += '\n'
    for (let j = 0; j < cave.length; j++) {
      string += cave[j][i] + ' '
    }
  }
  console.log(string)
}
