interface Solution12 {
  answer1: number
}
interface Square {
  elevation: string
  elevationNum: number
  start?: boolean
  end?: boolean
}
interface Coordinates {
  x: number
  y: number
}
type Map = Square[][]
type Path = Square[]

const ASCII_OFFSET_A = 96

export default async function solution(input: string): Promise<Solution12> {
  console.log(input)
  console.log('---')

  const map = parseMap(input)
  const end = map.flat().find(square => square.end)
  if (!end) throw new Error('No end in sight!')
  const possiblePaths = getPossiblePaths(end, map, [end])
  // console.log('possiblePaths')
  // console.log(possiblePaths)
  const fullPaths = possiblePaths.filter(
    path => path[0].end && path[path.length - 1].start
  )
  console.log('fullPaths')
  console.log(fullPaths)
  const answer1 = getShortestPath(fullPaths).length - 1

  return { answer1 }
}

function getPossiblePaths(
  square: Square,
  map: Map,
  currentPath: Path = []
): Path[] {
  const reachableNeighbors = getSurroundingSquares(square, map).filter(
    neighbor => !currentPath.includes(neighbor) && isReachable(neighbor, square)
  )
  const start = reachableNeighbors.find(neighbor => neighbor.start)
  if (start) {
    return [[...currentPath, start]]
  }

  console.log('paths so far:', currentPath)
  console.log('reachableNeighbors:', reachableNeighbors)

  return reachableNeighbors.reduce(
    (result, square) => [
      ...result,
      ...getPossiblePaths(square, map, [...currentPath, square]),
    ],
    [currentPath]
  )
}

function getShortestPath(paths: Path[]): Path {
  return paths.sort((a, b) => a.length - b.length)[0]
}

function getSurroundingSquares(square: Square, map: Map): Square[] {
  const { x, y } = getCoordinates(square, map)
  const targetCoordinates: Coordinates[] = [
    { x: x - 1, y: y },
    { x: x + 1, y: y },
    { x: x, y: y - 1 },
    { x: x, y: y + 1 },
  ]
  return (
    targetCoordinates
      .filter(coordinates => isOnMap(coordinates, map))
      .map(({ x, y }) => map[y][x])
      // prefer neighbors with lower elevation
      .sort((a, b) => a.elevationNum - b.elevationNum)
  )
}

function getCoordinates(square: Square, map: Map): Coordinates {
  let x
  let y
  outer: for (y = 0; y < map.length; y += 1) {
    const row = map[y]
    for (x = 0; x < row.length; x += 1) {
      if (row[x] === square) {
        break outer
      }
    }
  }
  if (x === undefined || y === undefined) throw new Error('Square not found')
  return { x, y }
}

function isReachable(target: Square, current: Square): boolean {
  const diff = current.elevationNum - target.elevationNum
  // go down 1 level, or stay on same elevation
  return [0, 1].includes(diff)
}

function isOnMap(coordinates: Coordinates, map: Map): boolean {
  const { x, y } = coordinates
  return x >= 0 && x < map[0].length && y >= 0 && y < map.length
}

function parseMap(input: string): Map {
  return input.split('\n').map(line =>
    line.split('').map(char => {
      let elevation = char
      let start
      let end
      if (char === 'S') {
        elevation = 'a'
        start = true
      }
      if (char === 'E') {
        elevation = 'z'
        end = true
      }
      const square: Square = {
        elevation,
        elevationNum: elevation.charCodeAt(0) - ASCII_OFFSET_A,
      }
      if (start) square.start = start
      if (end) square.end = end
      return square
    })
  )
}
