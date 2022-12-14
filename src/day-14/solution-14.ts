interface Solution14 {
  answer1: number
}
type Air = '.'
type Rock = '#'
type Sand = '+'
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
  console.log(input)
  console.log('---')

  const cornerPaths = parsePaths(input)
  console.log('vectors:')
  console.log(cornerPaths)
  const cornerPathsNormalized = normalizePaths(cornerPaths)
  console.log('vectorsNormalized:')
  console.log(cornerPathsNormalized)
  const paths = cornerPathsNormalized.map(fillPath)
  console.log('paths')
  console.log(paths)

  const cave = getCave(paths)
  console.log(cave)
  printCave(cave)

  return { answer1: 0 }
}

function getCave(normalizedRockPaths: Path[]): Cave {
  const flatCoordinates = normalizedRockPaths.flat()
  const width = getExtremeCoordinate(flatCoordinates, 'x', 'max') + 1
  const height = getExtremeCoordinate(flatCoordinates, 'y', 'max') + 1
  console.log('width:', width)
  console.log('height:', height)

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
function normalizePaths(paths: Path[]): Path[] {
  // include sand start coordinates:
  const flatCoordinates = [...paths.flat(), SAND_START]
  const xMin = getExtremeCoordinate(flatCoordinates, 'x', 'min')
  const yMin = getExtremeCoordinate(flatCoordinates, 'y', 'min')
  return paths.map(path =>
    path.map(({ x, y }) => ({ x: x - xMin, y: y - yMin }))
  )
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
