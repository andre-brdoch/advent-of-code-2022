export interface Coordinate {
  x: number
  y: number
}
export type MainDirections = 'N' | 'S' | 'E' | 'W'
export type Direction = 'N' | 'S' | 'E' | 'W' | 'NW' | 'NE' | 'SW' | 'SE'
export interface Elf {
  moveTo?: Coordinate
  name: string
}
export interface ElfLocation extends Coordinate {
  elf: Elf
  type: 'elf'
}
export interface EmptyLocation extends Coordinate {
  type: 'empty'
}
export interface Movement {
  from: ElfLocation
  to: ElfLocation
}
// map to look up elfs via y/x coordinates
export interface Grid {
  [key: string]: {
    [key: string]: Elf
  }
}
export type GridArray = (ElfLocation | EmptyLocation)[][]
export type Axis = keyof Coordinate
