export type Direction = 'U' | 'R' | 'D' | 'L'
export interface Motion {
  direction: Direction
  amount: number
}
export interface Position {
  x: number
  y: number
}
export type Axis = keyof Position
export type RopeMovement = Position[][]
