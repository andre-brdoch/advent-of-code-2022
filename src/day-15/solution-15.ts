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
  console.log(sensors)
  console.log(cave.toString())

  cave.identifyGuaranteedFreeCells()
  console.log(cave.toString())

  // TODO: need to dynamically extend grid when sensors search
  const targetY = isTest() ? 10 : 2000000
  const result = cave.grid
    .map(row => row[targetY])
    .filter(cell => cell.type === 'empty').length
  console.log(result)

  return { answer1: 0 }
}

class Cave {
  public grid
  private sensors: Sensor[]
  private beacons: Beacon[]

  constructor(sensors: Sensor[]) {
    const beacons = sensors.map(sensor => sensor.closestBeacon)
    const { offsetX, offsetY } = getNormalizeOffset([...sensors, ...beacons])
    this.sensors = sensors.map(sensor =>
      normalizeCoordinate(sensor, offsetX, offsetY)
    )
    this.beacons = beacons.map(sensor =>
      normalizeCoordinate(sensor, offsetX, offsetY)
    )
    this.grid = this.getInitialCave()
  }

  public identifyGuaranteedFreeCells = () => {
    const forSureEmptyCells = [
      ...new Set(this.sensors.flatMap(this.getAllReachableCells)),
    ].filter(cell => cell && cell.type === 'unknown')

    forSureEmptyCells.forEach(cell => {
      this.grid[cell.x][cell.y] = { ...cell, type: 'empty' }
    })
    console.log(forSureEmptyCells)
  }

  public getAllReachableCells = (sensor: Sensor): Cell[] => {
    const { closestBeacon: beacon, x, y } = sensor
    const distance = getManhattanDistance(sensor, beacon)
    console.log('sensor:', `${x}/${y}`)
    console.log('distance:', distance)
    const xRange = range(x - distance, x + distance)
    const yRange = range(y - distance, y + distance)
    console.log(xRange)
    console.log(yRange)

    const rows: Coordinate[][] = []

    let radius = 0
    Array.from(Array(distance * 2 + 1)).forEach((_, i) => {
      const coordinates = range(x - radius, x + radius).map(x => ({
        x,
        y: y - distance + i,
      }))
      console.log(i, radius)
      rows.push(coordinates)

      // go from distance to 0 and back to distance:
      if (i < distance) radius += 1
      else radius -= 1
    })
    const reachableCoordinates = rows
      .flat()
      .filter(
        ({ x, y }) =>
          0 <= x && x < this.grid.length && 0 <= y && y < this.grid.length
      )

    return reachableCoordinates.map(({ x, y }) => this.grid[x][y])
  }

  public toString(): string {
    let string = ''
    for (let i = 0; i < this.grid[0].length; i++) {
      string += '\n'
      for (let j = 0; j < this.grid.length; j++) {
        const type = this.grid[j][i].type
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

  private getInitialCave(): CaveGrid {
    const combined = [...this.sensors, ...this.beacons]
    const width = getExtremeCoordinate(combined, 'x', 'max') + 1
    const height = getExtremeCoordinate(combined, 'y', 'max') + 1
    const cave: CaveGrid = Array.from(Array(width)).map((_, x) =>
      Array.from(Array(height)).map((_, y) => ({
        type: 'unknown',
        x,
        y,
      }))
    )
    combined.forEach(cell => {
      cave[cell.x][cell.y] = cell
    })
    return cave
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
