export interface Coordinate {
  x: number
  y: number
}
export interface Coordinate3D extends Coordinate {
  z: number
}
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
export interface Plane {
  name: string
  x: number
  y: number
  edges: Record<Facing, PlaneEdge>
  finalPosition?: boolean
}
export interface PlaneEdge {
  from: Coordinate3D
  to: Coordinate3D
  planes: Plane[]
}
