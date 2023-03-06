export interface DistanceMap {
  [key: string]: number
}
export interface PotentialMap {
  [key: string]: number
}
export interface ValveParsed {
  name: string
  flowRate: number
  neighborNames?: string[]
  neighbors?: (ValveParsed | Valve)[]
}
export interface Valve extends Omit<ValveParsed, 'neighborNames'> {
  neighbors: Valve[]
}
export interface ValveAnalyzed extends Valve {
  distances: DistanceMap
  potentialByRound: PotentialMap
}
export type CameFromMap = Record<string, QueueState | null>
export interface QueueState {
  valveName: string
  currentTotalFlow: number
  timeLeft: number
}
export interface SimpleActionPath {
  valveNames: string[]
  totalFlow: number
}
export interface Pairing {
  actions: [SimpleActionPath, SimpleActionPath]
  totalFlow: number
}
