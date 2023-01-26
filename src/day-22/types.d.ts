export interface Solution22 {
  answer1: number
}
export interface Coordinate {
  x: number
  y: number
}
export type Axis = keyof Coordinate
export type Facing = '^' | '>' | 'v' | '<'
export interface PlayerLocation extends Coordinate {
  facing: Facing
}
export type Path = PlayerLocation[]
export interface Cell {
  type: '.' | '#' | ' ' | Facing
}
export type Grid = Cell[][]
export type RotateInstruction = 'L' | 'R'
export type MoveInstruction = number
export type Instruction = MoveInstruction | RotateInstruction
export type EdgeName = Facing
export interface PlaneEdge {
  name: EdgeName
  from: Coordinate
  to: Coordinate
  planes: Plane[]
  folded?: boolean
}
export interface Plane {
  name: string
  x: number
  y: number
  z: number
  edges: Record<Facing, PlaneEdge>
}
export interface PlaneRotated extends Plane {
  xRotate: number
  yRotate: number
}
