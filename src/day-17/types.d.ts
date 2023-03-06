export type JetPattern = '<' | '>'
export type Direction = JetPattern | 'v'
export type Axis = 'x' | 'y'
export type Coordinate = Record<Axis, number>
export type StoneShape = 'plus' | 'minus' | 'l' | 'i' | 'square'
export interface Stone {
  shape: StoneShape
  name: string
  pieces: StonePiece[]
  resting?: boolean
  type: 'stone'
  height: number
  width: number
}
export interface StonePiece extends Coordinate {
  stone: Stone
  type: 'piece'
}
export interface StoneBluePrint extends Omit<Stone, 'pieces' | 'x' | 'y'> {
  pieceCoordinates: Coordinate[]
}
export interface Empty {
  type: 'empty'
}
export interface Floor {
  type: 'floor'
}
export type Cell = StonePiece | Empty | Floor
export type Grid = Cell[][]
export type ShapeCoordinates = Record<StoneShape, Coordinate[]>
export type StoneBluePrintsByShape = Record<StoneShape, StoneBluePrint>
export interface Segment {
  stoneAmount: number
  height: number
  repeats?: number
}
export type CycleDetector = Record<
  StoneShape,
  {
    [jetPatternIndex: string]: {
      [surface: string]: {
        lastIndex: number
        height: number
      }
    }
  }
>
