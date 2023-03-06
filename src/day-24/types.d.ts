export interface Coordinate {
  x: number
  y: number
}
export interface TimedCoordinate extends Coordinate {
  turn: number
}
export type Blizzard = '^' | '>' | 'v' | '<'
export type Wall = '#'
export type Player = 'E'
export type Empty = '.'
export type Cell = Blizzard | Blizzard[] | Wall | Player | Empty
export type Grid = Cell[][]
export interface CameFromByTurn {
  [turn: string]: {
    [id: string]: Coordinate | null
  }
}
