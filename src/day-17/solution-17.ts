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
type StoneBluePrintsByShape = Record<StoneShape, StoneBluePrint>

// piece coordinates, width and height will never change per stone shape,
// therefore save in constant to avoid unnecessary computations
const STONE_BLUEPRINTS = getStoneBluePrints()

const STONE_X_OFFSET = 2
const STONE_Y_OFFSET = 3

const logger = new Logger()

export default async function solution(input: string): Promise<Solution17> {
  const jetPatterns = parseJetPatterns(input)
  const grid = createGrid(7, 5)
  const gridHeight = getGridHeight(grid)
  logger.log('height', gridHeight)
  logger.log(stringifyGrid(grid))
  const stone = createStone('plus', {
    x: STONE_X_OFFSET,
    y: gridHeight + STONE_Y_OFFSET,
  })
  growGridTo(grid, stone.y + stone.height)
  logger.log(stringifyGrid(grid, stone))

  return { answer1: 0 }
}

function growGridTo(grid: Grid, amount: number): void {
  const diff = amount - grid.length
  if (diff < 1) return
  const width = grid[0].length
  Array.from(Array(diff)).forEach(() => {
    const row: Cell[] = Array.from(Array(width)).map(() => ({ type: 'empty' }))
    grid.push(row)
  })
}

function createStone(shape: StoneShape, startLocation: Coordinate): Stone {
  const blueprint = STONE_BLUEPRINTS[shape]
  const stone: Stone = {
    ...startLocation,
    ...blueprint,
    pieces: [],
  }
  stone.pieces = blueprint.pieceCoordinates.map(coordinate => ({
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

function getGridHeight(grid: Grid): number {
  // grid height minus empty rows on top
  const firstNonEmptyRow = grid
    .slice()
    .reverse()
    .findIndex(row => row.some(cell => cell.type !== 'empty'))
  return grid.length - firstNonEmptyRow
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

function getStoneBluePrints(): StoneBluePrintsByShape {
  const coordinatesByShape: ShapeCoordinates = {
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

  return (Object.keys(coordinatesByShape) as StoneShape[]).reduce(
    (result, key) => {
      const pieceCoordinates = coordinatesByShape[key]
      const blueprint = {
        pieceCoordinates,
        width: getMax(pieceCoordinates, 'x') + 1,
        height: getMax(pieceCoordinates, 'y') + 1,
        type: 'stone',
      }
      return {
        ...result,
        [key]: blueprint,
      }
    },
    {} as StoneBluePrintsByShape
  )
}

function parseJetPatterns(input: string): JetPattern[] {
  return input.split('') as JetPattern[]
}
