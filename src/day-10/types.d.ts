export interface Solution10 {
  answer1: number
}
export type Command = 'addx' | 'noop'
export interface Line {
  command: Command
}
export interface LineAdd extends Line {
  value: number
}
export interface Cycle {
  number: number
  x: number
  signalStrength: number
  line: Line
}
export type Pixel = '#' | '.'
export type Screen = Pixel[][]
