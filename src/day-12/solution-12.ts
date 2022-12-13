interface Solution12 {
  answer1: number
}
interface Square {
  elevation: string
  start?: boolean
  end?: boolean
}
interface Coordinates {
  x: number
  y: number
}
type Map = Square[][]

export default async function solution(input: string): Promise<Solution12> {
  console.log(input)
  console.log('---')

  const map = parseMap(input)
  console.log(map)
  console.log(getSurroundingSquares(map[2][3], map))

  return { answer1: 0 }
}

function getSteps(map: Map): Square[] {
  const steps: Square[] = []
  const end = map.flat().find(square => square.end)
  if (!end) throw new Error('No end in sight!')
  return steps
}

function getSurroundingSquares(square: Square, map: Map): Square[] {
  const { x, y } = getCoordinates(square, map)
  const targetCoordinates: Coordinates[] = [
    { x: x - 1, y: y },
    { x: x + 1, y: y },
    { x: x, y: y - 1 },
    { x: x, y: y + 1 },
  ]
  return targetCoordinates
    .filter(coordinates => isOnMap(coordinates, map))
    .map(({ x, y }) => map[y][x])
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
  return target.elevation.charCodeAt(0) - current.elevation.charCodeAt(0) <= 1
}

function isOnMap(coordinates: Coordinates, map: Map): boolean {
  const { x, y } = coordinates
  return x >= 0 && x < map[0].length && y >= 0 && y <= map.length
}

function parseMap(input: string): Map {
  return input.split('\n').map(line =>
    line.split('').map(char => {
      const square: Square = { elevation: char }
      if (char === 'S') {
        square.elevation = 'a'
        square.start = true
      }
      if (char === 'E') {
        square.elevation = 'z'
        square.end = true
      }
      return square
    })
  )
}
