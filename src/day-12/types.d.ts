export interface Square {
  elevation: string
  elevationNum: number
  start?: boolean
  end?: boolean
  name: string
}
export interface Coordinates {
  x: number
  y: number
}
export type Map = Square[][]
export type Path = Square[]
export interface CameFromMap {
  [key: string]: Square | null
}
export interface CostSoFarMap {
  [key: string]: number
}
