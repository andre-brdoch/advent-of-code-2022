export interface Solution19 {
  answer1: number
}
export type Material = 'ore' | 'clay' | 'obsidian' | 'geode'
export type Cost = [Material, number]
export interface Robot {
  material: Material
  costs: Cost[]
}
export interface Blueprint {
  name: string
  robots: Record<Material, Robot>
}
