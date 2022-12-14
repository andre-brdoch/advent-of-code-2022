interface Solution14 {
  answer1: number
}
type Air = '.'
type Rock = '#'
type Sand = 'o'
type Cell = Air | Rock | Sand
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
  const cave = getCave(paths)
  printCave(cave)

  const answer1 = fillSand(cave, sandStartNormalized)
  // const answer1 = 0

  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // addSandUnit(cave, sandStartNormalized)
  // //   should fall over
  // addSandUnit(cave, sandStartNormalized)
  printCave(cave)

  return { answer1 }
}

function fillSand(cave: Cave, sandStart: Coordinates): number {
  let count = 0
  let notFullYet = true
  while (notFullYet) {
    count += 1
    notFullYet = addSandUnit(cave, sandStart)
  }
  return count
}

function addSandUnit(cave: Cave, sandStart: Coordinates): boolean {
  const target: Coordinates = getNextSandPosition(cave, sandStart)
  if (!isInCave(cave, target)) return false
  cave[target.x][target.y] = 'o'
  return true
}

function getNextSandPosition(
  cave: Cave,
  sandCoordinates: Coordinates
): Coordinates {
  if (!isInCave(cave, sandCoordinates)) return sandCoordinates

  const bottom: Coordinates = { ...sandCoordinates, y: sandCoordinates.y + 1 }
  const bottomLeft: Coordinates = { x: bottom.x - 1, y: bottom.y + 1 }
  const bottomRight: Coordinates = { x: bottom.x + 1, y: bottom.y + 1 }

  if (isFree(cave, bottom)) {
    return getNextSandPosition(cave, bottom)
  }
  else if (isFree(cave, bottomLeft)) {
    return getNextSandPosition(cave, bottomLeft)
  }
  else if (isFree(cave, bottomRight)) {
    return getNextSandPosition(cave, bottomRight)
  }

  return sandCoordinates
}

function getCave(normalizedRockPaths: Path[]): Cave {
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
  return cell === '.'
}

/** Fills in all gaps in path with coordinates */
function fillPath(path: Path): Path {
  return path.reduce((result, pair, i) => {
    if (i === 0) return [...result, pair]
    const prevPair = result[i - 1]
    const vector: Coordinates = {
      x: pair.x - prevPair.x,
      y: pair.y - prevPair.y,
    }
    const axis: Axis = vector.x !== 0 ? 'x' : 'y'
    const directionModifier = vector[axis] > 0 ? -1 : 1
    const fillerPairCount = Math.abs(vector[axis]) - 1
    const fillerPairs = Array.from(Array(fillerPairCount)).map((_n, i) => ({
      ...pair,
      [axis]: pair[axis] + (i + 1) * directionModifier,
    }))
    return [...result, ...fillerPairs, pair]
  }, [] as Path)
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
      string += cave[j][i]
    }
  }
  console.log(string)
}
