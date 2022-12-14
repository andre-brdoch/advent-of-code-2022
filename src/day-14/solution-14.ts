interface Solution14 {
  answer1: number
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
  console.log('cornerPathsNormalized')
  console.log(cornerPathsNormalized)
  const paths = cornerPathsNormalized.map(fillPath)
  console.log('paths')
  console.log(paths)

  const cave = getCave(paths)
  printCave(cave)

  const answer1 = fillSand(cave, sandStartNormalized)
  // const answer1 = 0

  // const between = getNumbersBetween(4,1)
  // console.log(between);
  

  Array.from(Array(56)).forEach(() => addSandUnit(cave, sandStartNormalized))

  // printCave(cave)

  return { answer1 }
}

function fillSand(cave: Cave, sandStart: Coordinates): number {
  cave[sandStart.x][sandStart.y] = '+'

  let count = 0
  let notFullYet = true
  while (notFullYet) {
    count += 1
    notFullYet = addSandUnit(cave, sandStart)
  }
  return count - 1
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
  return ['.', '+'].includes(cell)
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
    // console.log(getNumbersBetween(prevPair[axis], pair[axis]))
    const fillerPairs = getNumbersBetween(prevPair[axis], pair[axis]).map(number => ({
      ...pair,
      [axis]: number
    }))
    return [...result, ...fillerPairs, pair]
  }, [] as Path)
}

function getNumbersBetween(a: number, b: number): number[] {
  const between: number[] = []
  const max = Math.max(a,b)
  let min = Math.min(a,b)
  if (max - min <= 1) return between
  while (min < max - 1) {
    min = min + 1;
    between.push(min)
  }
  if (max === a) return between.slice().reverse()
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
