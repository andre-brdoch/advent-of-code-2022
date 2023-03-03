export interface Solution7 {
  answer1: number
  answer2: number
}
type LineType = 'command' | 'dir' | 'file'
export type Command = 'cd' | 'ls'
export interface Line {
  type: LineType
  line: string
}
export interface LineDir extends Line {
  name: string
}
export interface LineFile extends Line {
  name: string
  size: number
}
export interface LineCommand extends Line {
  command: Command
}
export interface LineCdCommand extends LineCommand {
  targetDir: string
}
export type Data = File | Dir
export interface File {
  name: string
  size: number
  parent: Dir
}
export interface Dir {
  name: string
  children: Data[]
  parent?: Dir
  size?: number
}
export interface AnalyzedDir extends Dir {
  size: number
  children: AnalyzedData[]
}
export type AnalyzedData = File | AnalyzedDir
