export interface Coordinate {
  x: number
  y: number
  z: number
}
export interface Cube extends Coordinate {
  type: 'lava' | 'air' | 'water' | 'unknown'
}
export type Axis = keyof Coordinate
export type Grid = Cube[][][]
export interface Boundaries {
  maxX: number
  maxY: number
  maxZ: number
  minX: number
  minY: number
  minZ: number
}
