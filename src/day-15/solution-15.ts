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
interface Boundaries {
  min: number
  max: number
}
interface CombinedSensorOutlinesMap {
  [key: string]: {
    fromX: number
    toX: number
  }[]
}

const TARGET_Y = isTest() ? 10 : 2000000
const BOUNDARIES: Boundaries = isTest()
  ? { min: 0, max: 20 }
  : { min: 0, max: 4000000 }
const TUNING_FREQUENCY_MODIFIER = 4000000

export default async function solution(input: string): Promise<Solution15> {
  const sensors = parseSensors(input)
  const cave = new Cave(sensors)
  cave.addRangeOutlines()
  console.log('done outlining')
  console.log(cave.stringifyGrid('outlines', true))

  const { emptyCells } = cave.analyzeRow(TARGET_Y)
  const answer1 = emptyCells.length

  const hiddenBeacon = cave.findHiddenBeacon()
  console.log(`Hidden Beacon found at ${strinfifyCoordinate(hiddenBeacon)}!\n`)
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

  private outlineMap: CombinedSensorOutlinesMap

  constructor(sensors: Sensor[]) {
    this.sensors = sensors
    this.beacons = [...new Set(sensors.map(sensor => sensor.closestBeacon))]
    // TODO: remove
    this.emptyCells = []
    this.outlineMap = {}

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

  public findHiddenBeacon(): Beacon {
    for (let y = 0; y < this.yMaxBoundaries; y++) {
      // Attempt drawing a line. If it has a gap , or doesn't start/end
      // at the first/last cell, we found the hidden beacon.
      const xBoundaries = this.outlineMap[y].sort((a, b) => a.fromX - b.fromX)

      let highestX: number | undefined = undefined

      for (let i = 0; i < xBoundaries.length; i++) {
        const { fromX, toX } = xBoundaries[i]
        const newHighestX = Math.max(toX, highestX ?? this.xMinBoundaries)

        const firstNotCovered = i === 0 && fromX > this.xMinBoundaries
        const lastNotCovered =
          i === xBoundaries.length - 1 && newHighestX < this.xMaxBoundaries
        const skippedOne = highestX !== undefined && fromX > highestX + 1
        if (firstNotCovered || lastNotCovered || skippedOne) {
          // found it!
          return {
            y,
            x: fromX - 1,
            type: 'beacon',
          }
        }
        highestX = newHighestX
      }
    }
    throw new Error('There is no hidden beacon :(')
  }

  public addRangeOutlines(): void {
    // Find outline of ranges, and save it in a map by y value.
    // This will allow faster lookup for finding the answers.

    for (let i = 0; i < this.sensors.length; i++) {
      const sensor = this.sensors[i]
      const { closestBeacon: beacon, x, y } = sensor
      const distance = getManhattanDistance(sensor, beacon)
      let radius = 0

      for (let j = 0; j < distance * 2 + 1; j++) {
        const yAdjusted = y - distance + j
        const entry = { fromX: x - radius, toX: x + radius }

        if (this.outlineMap[yAdjusted] === undefined) {
          this.outlineMap[yAdjusted] = [entry]
        }
        else {
          this.outlineMap[yAdjusted].push(entry)
        }

        // go from 0 to distance and back to 0:
        if (j < distance) radius += 1
        else radius -= 1
      }
    }
  }

  // TODO: refactor to be based upon outline instead
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
      const occupiedBy = [...this.sensors, ...this.beacons].find(
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

  // todo: make private
  /**
   * Finds all sensors that are fully enclosed by another one.
   */
  public findFullyEnclosedSensors(): Sensor[] {
    const result: Sensor[] = []
    this.sensors.forEach(sensor => {
      // TODO: implement
      const isFullyEnclosed = this.sensors.some(s => s !== sensor && true)
      if (isFullyEnclosed) {
        result.push(sensor)
      }
    })
    return result
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

  // === Visualizations === /

  /**
   * Prints grid. Only meant to be used for relatively small coordinate systems.
   */
  public stringifyGrid(
    mode: 'full' | 'outlines' = 'full',
    withBoundaries = false
  ): string {
    const grid =
      mode === 'outlines'
        ? this.getOutlineGrid(withBoundaries)
        : this.getFullGrid(withBoundaries)
    let string = ''
    for (let y = 0; y < grid.length; y++) {
      string += '\n'
      for (let x = 0; x < grid[0].length; x++) {
        string += grid[y][x] + ' '
      }
    }
    return string + '\n'
  }

  /**
   * Returns a printable grid of beacons, sensors, and all of the
   * known empty cells within their range.
   * Only meant to be used for relatively small coordinate systems.
   */
  private getFullGrid(withBoundaries = false): string[][] {
    const { yStart, yEnd } = this.getRanges(withBoundaries)
    const grid = []

    for (let y = yStart; y < yEnd; y++) {
      const row = []
      const { allCells } = this.analyzeRow(y, withBoundaries)
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
        row.push(marker)
      }
      grid.push(row)
    }
    return grid
  }

  /**
   * Returns a printable grid of beacons, sensors, and the range of their outlines.
   * Only meant to be used for relatively small coordinate systems.
   */
  private getOutlineGrid(withBoundaries = false): string[][] {
    const { yStart, yEnd, xStart, xEnd } = this.getRanges(withBoundaries)
    const grid = []

    for (let y = yStart; y < yEnd; y++) {
      const boundaryPairs = this.outlineMap[y + (withBoundaries ? yStart : 0)]
      const row = []
      for (let x = xStart; x < xEnd; x++) {
        const device = [...this.sensors, ...this.beacons].find(
          cell => cell.x === x && cell.y === y
        )
        let marker = '.'
        if (device !== undefined && device.type === 'sensor') {
          marker = 'S'
        }
        else if (device !== undefined && device.type === 'beacon') {
          marker = 'B'
        }
        else if (
          (boundaryPairs ?? []).some(({ fromX, toX }) => {
            const xAdjusted = x + (withBoundaries ? xStart : 0)
            return fromX === xAdjusted || toX === xAdjusted
          })
        ) {
          marker = '#'
        }
        row.push(marker)
      }
      grid.push(row)
    }
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
