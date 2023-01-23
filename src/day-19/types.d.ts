export interface Solution19 {
  answer1: number
  answer2: number
}
export type Material = 'ore' | 'clay' | 'obsidian' | 'geode'
export type Cost = [Material, number]
export interface Robot {
  material: Material
}
export interface RobotBlueprint extends Robot {
  costs: Cost[]
}
export interface Blueprint {
  id: number
  robots: Record<Material, RobotBlueprint>
}
export type MaterialAmounts = Record<Material, number>
export interface Turn {
  finalRobots: Robot[]
  finalStock: MaterialAmounts
  buy?: RobotBlueprint
  number: number
}
export type Sequence = Turn[]
export interface CameFrom {
  [turnId: string]: Turn | null
}
export interface NextOptionsCache {
  [turnId: string]: Turn[]
}
