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
type Path = Coordinates[]

export default async function solution(input: string): Promise<Solution14> {
  console.log(input)
  console.log('---')

  const paths = parsePaths(input)
  console.log(paths)
  const pathsNormalized = normalizePaths(paths)
  console.log(pathsNormalized)

  const cave = getCave(pathsNormalized)
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

  console.log(cave)

  normalizedRockPaths.forEach(path =>
    path.forEach(({ x, y }) => {
      cave[x][y] = '#'
    })
  )

  return cave
}

/** Adjust coordinate range to start from 0/0 */
function normalizePaths(paths: Path[]): Path[] {
  const flatCoordinates = paths.flat()
  const xMin = getExtremeCoordinate(flatCoordinates, 'x', 'min')
  const yMin = getExtremeCoordinate(flatCoordinates, 'y', 'min')
  return paths.map(path =>
    path.map(({ x, y }) => ({ x: x - xMin, y: y - yMin }))
  )
}

function getExtremeCoordinate(
  coordinates: Coordinates[],
  axis: 'x' | 'y',
  type: 'min' | 'max'
): number {
  return coordinates
    .map(c => c[axis])
    .sort((a, b) => (type === 'min' ? a - b : b - a))[0]
}

function printCave(cave: Cave): void {
  const string = cave.map(row => row.join(' ')).join('\n\n')
  console.log(string)
}

function parsePaths(input: string): Path[] {
  return input.split('\n').map(line =>
    line.split(' -> ').map(coordinatesString => {
      const [x, y] = coordinatesString.split(',')
      return { x: Number(x), y: Number(y) }
    })
  )
}
