import { isTest } from '../utils/env-helpers.js'

interface Solution15 {
  answer1: number
  answer2: number
}
interface Coordinate {
  x: number
  y: number
  stringified?: string
}
type Axis = keyof Coordinate
interface Beacon extends Coordinate {
  type: 'beacon'
}
interface Sensor extends Coordinate {
  closestBeacon: Beacon
  range: number
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
interface Boundaries {
  min: number
  max: number
}

const TARGET_Y = isTest() ? 10 : 2000000
const BOUNDARIES: Boundaries = isTest()
  ? { min: 0, max: 20 }
  : { min: 0, max: 4000000 }
const TUNING_FREQUENCY_MODIFIER = 4000000

export default async function solution(input: string): Promise<Solution15> {
  const sensors = parseSensors(input)
  const cave = new Cave(sensors)

  // console.log(cave.toString(true))

  const { emptyCells } = cave.analyzeRow(TARGET_Y)
  const answer1 = emptyCells.length

  const hiddenBeacon = cave.findHiddenBeacon()
  console.log(hiddenBeacon)

  const answer2 = getTuningFrequency(hiddenBeacon)

  return { answer1, answer2 }
}

class Cave {
  public sensors: Sensor[]
  public beacons: Beacon[]
  public emptyCells: EmptyCell[]
  public xMin: number
  public xMax: number
  public yMin: number
  public yMax: number
  public xMinBoundaries: number
  public xMaxBoundaries: number
  public yMinBoundaries: number
  public yMaxBoundaries: number

  constructor(sensors: Sensor[]) {
    this.sensors = sensors
    this.beacons = [...new Set(sensors.map(sensor => sensor.closestBeacon))]
    // TODO: remove
    this.emptyCells = []

    const { xMin, xMax, yMin, yMax } = this.getExtremeCoordinates()
    this.xMin = xMin
    this.xMax = xMax
    this.yMin = yMin
    this.yMax = yMax

    const { min, max } = BOUNDARIES
    this.xMinBoundaries = Math.max(yMin, min)
    this.xMaxBoundaries = Math.min(yMax, max)
    this.yMinBoundaries = Math.max(xMin, min)
    this.yMaxBoundaries = Math.min(xMax, max)
  }

  public analyzeRow(
    y: number,
    withBoundaries = false
  ): {
    emptyCells: EmptyCell[]
    sensorCells: Sensor[]
    beaconCells: Beacon[]
    unknownCells: UnknownCell[]
    allCells: Cell[]
  } {
    const emptyCells: EmptyCell[] = []
    const sensorCells: Sensor[] = []
    const beaconCells: Beacon[] = []
    const unknownCells: UnknownCell[] = []
    const allCells: Cell[] = []

    const { xStart, xEnd } = this.getRanges(withBoundaries)

    for (let x = xStart; x < xEnd; x++) {
      let target: Cell = { x, y, type: 'unknown' }
      const isInReach = this.sensors.some(
        sensor => getManhattanDistance(sensor, target) <= sensor.range
      )
      const occupiedBy = this.getAllKnownFields().find(
        cell => strinfifyCoordinate(cell) === strinfifyCoordinate(target)
      )
      const isEmpty = isInReach && occupiedBy === undefined

      if (isEmpty) {
        target = { ...target, type: 'empty' }
        emptyCells.push(target)
      }
      else if (occupiedBy != null && occupiedBy.type === 'sensor') {
        target = { ...occupiedBy }
        sensorCells.push(target)
      }
      else if (occupiedBy != null && occupiedBy.type === 'beacon') {
        target = { ...occupiedBy }
        beaconCells.push(target)
      }
      else {
        unknownCells.push(target)
      }
      allCells.push(target)
    }
    return {
      emptyCells,
      sensorCells,
      beaconCells,
      unknownCells,
      allCells,
    }
  }

  public findHiddenBeacon(): Beacon {
    const { yStart, yEnd } = this.getRanges(true)

    for (let y = yStart; y < yEnd; y++) {
      const { unknownCells } = this.analyzeRow(y, true)
      if (unknownCells.length === 1) {
        const found = unknownCells[0]
        return { ...found, type: 'beacon' }
      }
    }
    throw new Error('There is no hidden beacon.')
  }

  public ruleOutOccupiedCells = () => {
    const allReachableCoordinates = [
      // remove duplicates
      ...new Set(
        this.sensors
          .flatMap(this.getAllReachableCoordinates)
          // stringify to make unique in set
          .map(strinfifyCoordinate)
      ),
    ]
      // un-stringify
      .map(parseCoordinate)

    this.emptyCells = allReachableCoordinates
      // not already a beacon or sensor
      .filter(
        ({ x, y }) =>
          !this.getAllKnownFields().some(cell => cell.x === x && cell.y === y)
      )
      .map(coordinates => ({ ...coordinates, type: 'empty' }))
  }

  public getAllReachableCoordinates = (sensor: Sensor): Coordinate[] => {
    const { closestBeacon: beacon, x, y } = sensor
    const distance = getManhattanDistance(sensor, beacon)
    const result: Coordinate[] = []

    let radius = 0
    Array.from(Array(distance * 2 + 1)).forEach((_, i) => {
      const coordinates = [radius === 0 ? x : x - radius, x + radius].map(
        x => ({
          x,
          y: y - distance + i,
        })
      )
      result.push(...coordinates)

      // go from distance to 0 and back to distance:
      if (i < distance) radius += 1
      else radius -= 1
    })

    return result
  }

  public getAllKnownFields() {
    return [...this.sensors, ...this.beacons, ...this.emptyCells]
  }

  public toString(withBoundaries = false): string {
    const { yStart, yEnd } = this.getRanges(withBoundaries)

    let string = ''

    for (let y = yStart; y < yEnd; y++) {
      const { allCells } = this.analyzeRow(y, withBoundaries)
      string += '\n'
      for (let j = 0; j < allCells.length; j++) {
        const type = allCells[j].type
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

  private getRanges(withBoundaries = false) {
    return {
      yStart: withBoundaries ? this.yMinBoundaries : this.yMin,
      yEnd: withBoundaries ? this.yMaxBoundaries : this.yMax,
      xStart: withBoundaries ? this.xMinBoundaries : this.xMin,
      xEnd: withBoundaries ? this.xMaxBoundaries : this.xMax,
    }
  }

  private getExtremeCoordinates(): {
    xMin: number
    xMax: number
    yMin: number
    yMax: number
    } {
    const rangeEdges: Coordinate[] = this.sensors.reduce((result, cell) => {
      const { x, y } = cell
      return [
        ...result,
        { x: x - cell.range, y },
        { x: x + cell.range + 1, y },
        { x, y: y - cell.range },
        { x, y: y + cell.range + 1 },
      ]
    }, [] as Coordinate[])

    const xMin = getExtremeCoordinate(rangeEdges, 'x', 'min')
    const xMax = getExtremeCoordinate(rangeEdges, 'x', 'max')
    const yMin = getExtremeCoordinate(rangeEdges, 'y', 'min')
    const yMax = getExtremeCoordinate(rangeEdges, 'y', 'max')
    return { xMin, xMax, yMin, yMax }
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

function getTuningFrequency(coordinate: Coordinate): number {
  const { x, y } = coordinate
  return x * TUNING_FREQUENCY_MODIFIER + y
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
    .map(c => c[axis] as number)
    .sort((a, b) => (type === 'min' ? a - b : b - a))[0]
}

function strinfifyCoordinate(coordinate: Coordinate): string {
  const { x, y } = coordinate
  return `${x}/${y}`
}

function parseCoordinate(string: string): Coordinate {
  const [x, y] = string.split('/')
  return { x: Number(x), y: Number(y) }
}

function parseSensors(input: string): Sensor[] {
  const sensors: Sensor[] = input
    .split('\n')
    .map(line =>
      line
        .replace('Sensor at ', '')
        .split(': closest beacon is at ')
        .map(string =>
          string
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
        )
    )
    .map(([sensor, beacon]) => ({
      ...sensor,
      type: 'sensor',
      range: getManhattanDistance(sensor, beacon),
      closestBeacon: {
        ...beacon,
        type: 'beacon',
        stringified: strinfifyCoordinate(beacon),
      },
    }))

  // remove duplicate beacons
  sensors.forEach(sensor => {
    const { closestBeacon: beacon } = sensor
    const otherSensors = sensors.filter(
      s =>
        s !== sensor &&
        s.closestBeacon !== beacon &&
        s.closestBeacon.stringified === beacon.stringified
    )
    otherSensors.forEach(s => {
      s.closestBeacon = beacon
    })
  })

  return sensors.map(sensor => {
    delete sensor.closestBeacon.stringified
    return sensor
  })
}

function range(from: number, to: number): number[] {
  const result = []
  for (let number = from; number <= to; number++) {
    result.push(number)
  }
  return result
}