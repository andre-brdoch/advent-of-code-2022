import { Logger } from '../utils/Logger.js'

interface Solution17 {
  answer1: number
}
type JetPattern = '<' | '>'
type Direction = JetPattern | 'v'
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

const VECTOR_BY_DIRECTION: Record<Direction, Coordinate> = {
  '<': { x: -1, y: 0 },
  '>': { x: 1, y: 0 },
  v: { x: 0, y: -1 },
}

const STONE_X_OFFSET = 2
const STONE_Y_OFFSET = 3

const logger = new Logger()

export default async function solution(input: string): Promise<Solution17> {
  const jetPatternQueue = parseJetPatterns(input)
  const grid = createGrid(7, 5)
  const shapeQueue: StoneShape[] = ['minus', 'plus', 'l', 'i', 'square']
  addFallingStone(grid, shapeQueue, jetPatternQueue)
  // const gridHeight = getGridHeight(grid)
  // logger.log('height', gridHeight)
  // logger.log(stringifyGrid(grid))
  // const stone = createStone('plus', {
  //   x: STONE_X_OFFSET,
  //   y: gridHeight + STONE_Y_OFFSET,
  // })
  // growGridTo(grid, stone.y + stone.height)
  // logger.log(stringifyGrid(grid, stone))

  return { answer1: 0 }
}

function addFallingStone(
  grid: Grid,
  shapeQueue: StoneShape[],
  jetPatternQueue: JetPattern[]
): void {
  const gridHeight = getGridHeight(grid)
  const stone = createStone(shapeQueue[0], {
    x: STONE_X_OFFSET,
    y: gridHeight + STONE_Y_OFFSET,
  })

  growGridTo(grid, stone.y + stone.height)
  logger.log(stringifyGrid(grid, stone))

  fall: while (!stone.resting) {
    const jetPattern = jetPatternQueue[0]
    const movements: Direction[] = [jetPattern, 'v']

    movement: for (let i = 0; i < movements.length; i++) {
      const direction = movements[i]
      const nextPieceCoordinates: Coordinate[] = []

      for (let j = 0; j < stone.pieces.length; j++) {
        const piece = stone.pieces[j]
        const nextCoordinate: Coordinate | null = moveCoordinate(
          grid,
          piece,
          direction
        )
        // if any piece would go out of the grid, stop the whole stone
        if (nextCoordinate === null) {
          break movement
        }
        // if any piece reaches the floor, stop the whole stone
        if (
          ['floor', 'piece'].includes(
            grid[nextCoordinate.y][nextCoordinate.y].type
          )
        ) {
          stone.resting = true
          break fall
        }
        nextPieceCoordinates.push(nextCoordinate)
      }

      // move all pieces
      stone.pieces.forEach((piece, i) => {
        const { x, y } = nextPieceCoordinates[i]
        piece.x = x
        piece.y = y
      })
      const stoneCoordinates = moveCoordinate(
        grid,
        stone,
        direction
      ) as Coordinate
      stone.x = stoneCoordinates.x
      stone.y = stoneCoordinates.y

      logger.log(stringifyGrid(grid, stone))
    }

    nextInQueue(jetPatternQueue)
    logger.log(stringifyGrid(grid, stone))
  }

  addRestingStoneToGrid(grid, stone)
  logger.log(stringifyGrid(grid))
}

function moveCoordinate(
  grid: Grid,
  coordinate: Coordinate,
  direction: Direction
): Coordinate | null {
  const vector = VECTOR_BY_DIRECTION[direction]
  const next = addVectors(coordinate, vector)
  if (!isOnGrid(grid, next)) {
    return null
  }
  return next
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

function addRestingStoneToGrid(grid: Grid, restingStone: Stone): void {
  if (!restingStone.resting) {
    throw new Error('Can not add stone that is still moving')
  }
  restingStone.pieces.forEach(piece => {
    grid[piece.y][piece.x] = piece
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

function isOnGrid(grid: Grid, coordinate: Coordinate) {
  const { x, y } = coordinate
  return x >= 0 && y >= 0 && x < grid[0].length && y < grid.length
}

function getMax(cordinates: Coordinate[], axis: Axis): number {
  return cordinates.map(cordinates => cordinates[axis]).sort((a, b) => b - a)[0]
}

function addVectors(a: Coordinate, b: Coordinate): Coordinate {
  return { x: a.x + b.x, y: a.y + b.y }
}

function nextInQueue<T>(queue: T[]): void {
  queue.push(queue.shift() as T)
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
        cell.type === 'floor'
          ? '='
          : cell.type === 'piece'
            ? '#'
            : piece !== undefined
              ? '@'
              : '.'
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
