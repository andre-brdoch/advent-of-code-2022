interface Solution12 {
  answer1: number
}
interface Square {
  elevation: string
  elevationNum: number
  start?: boolean
  end?: boolean
  name: string
}
interface Coordinates {
  x: number
  y: number
}
type Map = Square[][]
type Path = Square[]
interface CameFromMap {
  [key: string]: Square | null
}
interface CostSoFarMap {
  [key: string]: number
}

const ASCII_OFFSET_A = 96

export default async function solution(input: string): Promise<Solution12> {
  const map = parseMap(input)

  const path = getShortestPath(map)
  console.log(path)
  const answer1 = path.length - 1

  return { answer1 }
}

function getShortestPath(map: Map): Path {
  const start = map.flat().find(square => square.start)
  const end = map.flat().find(square => square.end)
  if (!start) throw new Error('These mountains are not very accessible.')
  if (!end) throw new Error('No end in sight!')

  // create map tracking "cheapest" fields to come from,
  // using Dijkstras algorithm:
  const frontier = new PriorityQueue<Square>()
  frontier.add(start, 0)
  const cameFrom: CameFromMap = { [start.name]: null }
  const costSoFar: CostSoFarMap = { [start.name]: 0 }

  while (!frontier.empty()) {
    const current = frontier.get()
    if (current === null) throw new Error('Queue empty, what to do?')
    if (current === end) {
      break
    }
    const reachableNeighbors = getSurroundingSquares(current, map).filter(
      neighbor => isReachable(neighbor, current)
    )
    reachableNeighbors.forEach(next => {
      // make it more expensive to go down again:
      const newCost =
        costSoFar[current.name] - (current.elevationNum - next.elevationNum) * 2
      if (!(next.name in costSoFar) || newCost < costSoFar[next.name]) {
        costSoFar[next.name] = newCost
        const priority = newCost
        frontier.add(next, priority)
        cameFrom[next.name] = current
      }
    })
  }

  // find shortest path
  const path: Path = [end]
  let current = end
  while (!current.start) {
    const cameFromSquare = cameFrom[current.name]
    if (cameFromSquare === null) throw new Error('Square not found')
    path.push(cameFromSquare)
    current = cameFromSquare
  }

  return path
}

class PriorityQueue<T> {
  private items: {
    item: T
    priority: number
  }[]

  constructor() {
    this.items = []
  }

  public add(item: T, priority: number) {
    this.items.push({ item, priority })
  }

  public get() {
    if (this.empty()) return null
    const highestPrio = this.items.sort((a, b) => b.priority - a.priority)[0]
    const i = this.items.indexOf(highestPrio)
    this.items.splice(i, 1)
    return highestPrio.item
  }

  public empty() {
    return this.items.length === 0
  }
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
  const diff = target.elevationNum - current.elevationNum
  // stay on same elevation, or go down
  return diff <= 1
}

function isOnMap(coordinates: Coordinates, map: Map): boolean {
  const { x, y } = coordinates
  return x >= 0 && x < map[0].length && y >= 0 && y < map.length
}

function parseMap(input: string): Map {
  return input.split('\n').map((line, i) =>
    line.split('').map((char, j) => {
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
        name: `${i}/${j}`,
      }
      if (start) square.start = start
      if (end) square.end = end
      return square
    })
  )
}
