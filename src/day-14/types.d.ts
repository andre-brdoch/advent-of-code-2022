export type Air = '.'
export type Rock = '#'
export type Sand = 'o'
export type SandStart = '+'
export type Cell = Air | Rock | Sand | SandStart
export type CaveGrid = Cell[][]
export interface Coordinates {
  x: number
  y: number
}
export type Axis = keyof Coordinates
export type Path = Coordinates[]
