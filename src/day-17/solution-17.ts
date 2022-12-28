import { Logger } from '../utils/Logger.js'

interface Solution17 {
  answer1: number
}
type JetPattern = '<' | '>'
interface Coordinate {
  x: number
  y: number
}
interface StonePiece extends Coordinate {
  stone: Stone
  type: 'stone'
}
interface Stone extends Coordinate {
  name: 'plus' | 'minus' | 'l' | 'i' | 'square'
  pieces: StonePiece[]
  resting?: boolean
  type: 'piece'
}
interface Empty {
  type: 'empty'
}
interface Floor {
  type: 'floor'
}
type Cell = StonePiece | Empty | Floor
type Grid = Cell[][]

const logger = new Logger()

export default async function solution(input: string): Promise<Solution17> {
  const jetPatterns = parseJetPatterns(input)
  const grid = createGrid(7, 4)
  logger.log(stringifyGrid(grid))
  return { answer1: 0 }
}

function stringifyGrid(grid: Grid): string {
  let string = ''
  for (let y = grid.length - 1; y >= 0; y--) {
    const wallMarker = y === 0 ? '+' : '|'
    string += wallMarker
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x]
      const marker = cell.type === 'floor' ? '=' : '.'
      string += marker
    }
    string += wallMarker + '\n'
  }
  return string
}

function createGrid(width: number, height: number): Grid {
  return Array.from(Array(height).keys()).map(y =>
    Array.from(Array(width)).map(() => ({ type: y === 0 ? 'floor' : 'empty' }))
  )
}

function parseJetPatterns(input: string): JetPattern[] {
  return input.split('') as JetPattern[]
}
