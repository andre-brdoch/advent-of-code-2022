import { Logger } from '../utils/Logger.js'

interface Solution17 {
  answer1: number
}
type JetPattern = '<' | '>'
type Axis = 'x' | 'y'
type Coordinate = Record<Axis, number>
type StoneShape = 'plus' | 'minus' | 'l' | 'i' | 'square'
interface Stone extends Coordinate {
  shape: StoneShape
  pieces: StonePiece[]
  resting?: boolean
  type: 'stone'
  height: number
  width: number
}
interface StonePiece extends Coordinate {
  stone: Stone
  type: 'piece'
}
interface StoneBluePrint extends Omit<Stone, 'pieces' | 'x' | 'y'> {
  pieceCoordinates: Coordinate[]
}
interface Empty {
  type: 'empty'
}
interface Floor {
  type: 'floor'
}
type Cell = StonePiece | Empty | Floor
type Grid = Cell[][]
type ShapeCoordinates = Record<StoneShape, Coordinate[]>
type StoneBluePrintByShape = Record<StoneShape, StoneBluePrint>

const SHAPE_COORDINATES: Record<StoneShape, Coordinate[]> = {
  plus: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
  ],
  minus: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ],
  l: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
  ],
  i: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 0, y: 3 },
  ],
  square: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
}

// piece coordinates, width and height will never change per stone shape
const STONE_BLUEPRINTS: StoneBluePrintByShape = (
  Object.keys(SHAPE_COORDINATES) as StoneShape[]
).reduce((result, key) => {
  const pieceCoordinates = SHAPE_COORDINATES[key]
  const blueprint = {
    pieceCoordinates,
    width: getMax(pieceCoordinates, 'x'),
    height: getMax(pieceCoordinates, 'y'),
    type: 'stone',
  }
  return {
    ...result,
    [key]: blueprint,
  }
}, {} as StoneBluePrintByShape)

const logger = new Logger()

export default async function solution(input: string): Promise<Solution17> {
  const jetPatterns = parseJetPatterns(input)
  const grid = createGrid(7, 5)
  logger.log(stringifyGrid(grid))
  const stone = createStone('plus', { x: 2, y: 4 })
  logger.log(stringifyGrid(grid, stone))
  growGrid(grid, 5)
  logger.log(stringifyGrid(grid, stone))

  return { answer1: 0 }
}

function growGrid(grid: Grid, amount: number): void {
  const width = grid[0].length
  Array.from(Array(amount)).forEach(() => {
    const row: Cell[] = Array.from(Array(width)).map(() => ({ type: 'empty' }))
    grid.push(row)
  })
}

function createStone(shape: StoneShape, startLocation: Coordinate): Stone {
  const pieceCoordinates = SHAPE_COORDINATES[shape]
  const blueprint = STONE_BLUEPRINTS[shape]
  const stone: Stone = {
    ...startLocation,
    ...blueprint,
    pieces: [],
  }
  stone.pieces = pieceCoordinates.map(coordinate => ({
    ...addVectors(coordinate, startLocation),
    type: 'piece',
    stone,
  }))
  return stone
}

function createGrid(width: number, height: number): Grid {
  return Array.from(Array(height).keys()).map(y =>
    Array.from(Array(width)).map(() => ({ type: y === 0 ? 'floor' : 'empty' }))
  )
}

function getMax(cordinates: Coordinate[], axis: Axis): number {
  return cordinates.map(cordinates => cordinates[axis]).sort((a, b) => b - a)[0]
}

function addVectors(a: Coordinate, b: Coordinate): Coordinate {
  return { x: a.x + b.x, y: a.y + b.y }
}

function stringifyGrid(
  grid: Grid,
  fallingStone: Stone | undefined = undefined
): string {
  let string = ''
  for (let y = grid.length - 1; y >= 0; y--) {
    const wallMarker = y === 0 ? '+' : '|'
    string += wallMarker
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x]
      const piece = fallingStone?.pieces.find(
        piece => piece.x === x && piece.y === y
      )
      const marker =
        cell.type === 'floor' ? '=' : piece !== undefined ? '@' : '.'
      string += marker
    }
    string += wallMarker + '\n'
  }
  return string
}

function parseJetPatterns(input: string): JetPattern[] {
  return input.split('') as JetPattern[]
}
