import { Coordinate } from './types'

export function isOnGrid<T>(grid: T[][], coordinate: Coordinate) {
  try {
    return !!grid[coordinate.y][coordinate.x]
  }
  catch (err) {
    return false
  }
}
