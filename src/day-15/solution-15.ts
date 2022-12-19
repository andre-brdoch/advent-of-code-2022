import { isTest } from '../utils/env-helpers.js'

interface Solution15 {
  answer1: number
}
2000000
interface Coordinate {
  x: number
  y: number
}
type Axis = keyof Coordinate
interface Beacon extends Coordinate {
  type: 'beacon'
}
interface Sensor extends Coordinate {
  closestBeacon: Beacon
  type: 'sensor'
}
interface UnknownCell extends Coordinate {
  type: 'unknown'
}
interface EmptyCell extends Coordinate {
  type: 'empty'
}
type Cell = Sensor | Beacon | EmptyCell | UnknownCell
type CaveGrid = Cell[][]

export default async function solution(input: string): Promise<Solution15> {
  console.log(input)
  console.log('----')

  const sensors = parseSensors(input)
  const cave = new Cave(sensors)

  console.log(cave.toString())

  cave.ruleOutOccupiedCells()
  console.log(cave.toString())

  // TODO: need to dynamically extend grid when sensors search
  // const targetY = isTest() ? 10 : 2000000
  // const result = cave.grid
  //   .map(row => row[targetY])
  //   .filter(cell => cell.type === 'empty').length
  // console.log(result)

  return { answer1: 0 }
}

class Cave {
  private sensors: Sensor[]
  private beacons: Beacon[]
  private emptyCells: EmptyCell[]

  constructor(sensors: Sensor[]) {
    this.sensors = sensors
    this.beacons = sensors.map(sensor => sensor.closestBeacon)
    this.emptyCells = []
  }

  public ruleOutOccupiedCells = () => {
    const allReachableCoordinates = [
      // remove duplicates
      ...new Set(
        this.sensors
          .flatMap(this.getAllReachableCoordinates)
          // stringify to make unique in set
          .map(({ x, y }) => `${x}/${y}`)
      ),
    ]
      // un-stringify
      .map(stringifiedCoordinate => {
        const [x, y] = stringifiedCoordinate.split('/')
        return { x: Number(x), y: Number(y) }
      })

    this.emptyCells = allReachableCoordinates
      // not already a beacon or sensor
      .filter(
        ({ x, y }) =>
          ![...this.sensors, ...this.beacons].some(
            cell => cell.x === x && cell.y === y
          )
      )
      .map(coordinates => ({ ...coordinates, type: 'empty' }))
  }

  public getAllReachableCoordinates = (sensor: Sensor): Coordinate[] => {
    const { closestBeacon: beacon, x, y } = sensor
    const distance = getManhattanDistance(sensor, beacon)
    const rows: Coordinate[][] = []

    let radius = 0
    Array.from(Array(distance * 2 + 1)).forEach((_, i) => {
      const coordinates = range(x - radius, x + radius).map(x => ({
        x,
        y: y - distance + i,
      }))
      rows.push(coordinates)

      // go from distance to 0 and back to distance:
      if (i < distance) radius += 1
      else radius -= 1
    })

    return rows.flat()
  }

  public toString(): string {
    const grid = this.getNormalizedGrid()
    let string = ''
    for (let i = 0; i < grid[0].length; i++) {
      string += '\n'
      for (let j = 0; j < grid.length; j++) {
        const type = grid[j][i].type
        const marker =
          type === 'sensor'
            ? 'S'
            : type === 'beacon'
              ? 'B'
              : type === 'empty'
                ? '#'
                : '.'
        string += marker + ' '
      }
    }
    return string
  }

  private getNormalizedGrid(): CaveGrid {
    const combined = [...this.sensors, ...this.beacons, ...this.emptyCells]
    const { offsetX, offsetY } = getNormalizeOffset(combined)
    const normalized = combined.map(cell =>
      normalizeCoordinate(cell, offsetX, offsetY)
    )
    const width = getExtremeCoordinate(normalized, 'x', 'max') + 1
    const height = getExtremeCoordinate(normalized, 'y', 'max') + 1
    const grid: CaveGrid = Array.from(Array(width)).map((_, x) =>
      Array.from(Array(height)).map((_, y) => ({
        type: 'unknown',
        x,
        y,
      }))
    )
    normalized.forEach(cell => {
      grid[cell.x][cell.y] = cell
    })
    return grid
  }
}

function getManhattanDistance(a: Coordinate, b: Coordinate): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

/** Get offset for normalization */
function getNormalizeOffset(coordinates: Coordinate[]): {
  offsetX: number
  offsetY: number
} {
  const xMin = getExtremeCoordinate(coordinates, 'x', 'min')
  const yMin = getExtremeCoordinate(coordinates, 'y', 'min')
  return {
    offsetX: -xMin,
    offsetY: -yMin,
  }
}

/** Adjust coordinate range to start from 0/0 */
function normalizeCoordinate(
  coordinate: Coordinate,
  offsetX: number,
  offsetY: number
): any {
  const { x, y } = coordinate
  return { ...coordinate, x: x + offsetX, y: y + offsetY }
}

function getExtremeCoordinate(
  coordinates: Coordinate[],
  axis: Axis,
  type: 'min' | 'max'
): number {
  return coordinates
    .map(c => c[axis])
    .sort((a, b) => (type === 'min' ? a - b : b - a))[0]
}

function parseSensors(input: string): Sensor[] {
  return input
    .split('\n')
    .map(line =>
      line
        .replace('Sensor at ', '')
        .split(': closest beacon is at ')
        .map(parseCoordinates)
    )
    .map(([sensor, beacon]) => ({
      ...sensor,
      type: 'sensor',
      closestBeacon: {
        ...beacon,
        type: 'beacon',
      },
    }))
}

function parseCoordinates(string: string): Coordinate {
  return string
    .replace('x=', '')
    .replace('y=', '')
    .split(', ')
    .map(str => Number(str))
    .reduce(
      (result, axis, i) => ({
        ...result,
        [i === 0 ? 'x' : 'y']: axis,
      }),
      {} as Coordinate
    )
}

function range(from: number, to: number): number[] {
  const result = []
  for (let number = from; number <= to; number++) {
    result.push(number)
  }
  return result
}
