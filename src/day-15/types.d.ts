export interface Coordinate {
  x: number
  y: number
  stringified?: string
}
export type Axis = keyof Coordinate
export interface Beacon extends Coordinate {
  type: 'beacon'
}
export interface Sensor extends Coordinate {
  closestBeacon: Beacon
  range: number
  type: 'sensor'
}
export interface Boundaries {
  min: number
  max: number
}
export interface xMinMax {
  fromX: number
  toX: number
}
export interface CombinedSensorOutlinesMap {
  [key: string]: xMinMax[]
}
