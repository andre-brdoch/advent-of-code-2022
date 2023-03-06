import { parseArgs } from '../utils/env-helpers.js'
import { SolutionFn } from '../types.js'
import {
  Coordinate,
  Axis,
  Sensor,
  Beacon,
  Boundaries,
  xMinMax,
  CombinedSensorOutlinesMap,
} from './types'
import { Logger } from '../utils/Logger.js'

const { isTest, noLog, visualize } = parseArgs()
const loggers = [
  new Logger({ outputName: 'output-outline.txt' }),
  new Logger({ outputName: 'output-filled.txt' }),
]
let logger = loggers[0]

const TARGET_Y = isTest ? 10 : 2000000
const TUNING_FREQUENCY_MODIFIER = 4000000
const BOUNDARIES: Boundaries = isTest
  ? { min: 0, max: 20 }
  : { min: 0, max: 4000000 }

export default (async function solution(input) {
  const timer1 = performance.now()
  const sensors = parseSensors(input)
  const cave = new Cave(sensors)

  const timer2 = performance.now()
  console.log('Start outlining...')

  cave.addRangeOutlines()

  const timer3 = performance.now()
  console.log(
    `Finished outlining after ${formatTimeDuration(timer2, timer3)}\n`
  )
  logger.log(cave.stringifyGrid('outlines', false))
  logger = loggers[1]
  logger.log(cave.stringifyGrid('full', false))

  console.log(`Start counting empty cells in row ${TARGET_Y}...`)

  const answer1 = cave.getEmptyCellCount(TARGET_Y)

  const timer4 = performance.now()
  console.log(`Finished counting after ${formatTimeDuration(timer1, timer4)}\n`)

  console.log('Search for hidden beacon...')

  const hiddenBeacon = cave.findHiddenBeacon()
  console.log(`Hidden Beacon found at ${strinfifyCoordinate(hiddenBeacon)}!\n`)

  const answer2 = getTuningFrequency(hiddenBeacon)

  const timer5 = performance.now()
  console.log(`Total processing time: ${formatTimeDuration(timer1, timer5)}\n`)

  return { answer1, answer2, visuals: loggers.map(l => l.getVisual()) }
} satisfies SolutionFn)

class Cave {
  public sensors: Sensor[]
  public beacons: Beacon[]
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

  /**
   * Finds hidden beacon within boundaries.
   * Traverses all rows within the boundaries, and attempts
   * to merge the min-max x-values for that line.
   * If the merged line has a gap, or doesn't start on the
   * first/end on the last cell, we found the hidden beacon.
   *
   * @returns Beacon that is not within range of any sensor,
   * and within the boundaries.
   */
  public findHiddenBeacon(): Beacon {
    for (let y = 0; y < this.yMaxBoundaries; y++) {
      const xMinMaxList = this.outlineMap[y].sort((a, b) => a.fromX - b.fromX)
      let highestX: number | undefined = undefined

      for (let i = 0; i < xMinMaxList.length; i++) {
        const { fromX, toX } = xMinMaxList[i]
        const newHighestX = Math.max(toX, highestX ?? this.xMinBoundaries)
        const firstNotCovered = i === 0 && fromX > this.xMinBoundaries
        const lastNotCovered =
          i === xMinMaxList.length - 1 && newHighestX < this.xMaxBoundaries
        const skippedOne = highestX !== undefined && fromX > highestX + 1
        if (firstNotCovered || lastNotCovered || skippedOne) {
          // found it!
          return { y, x: fromX - 1, type: 'beacon' }
        }
        highestX = newHighestX
      }
    }
    throw new Error('There is no hidden beacon :(')
  }

  /**
   * Finds the outlines of all sensor ranges, and saves them in
   * a instance-wide outline map by y-value.
   * This will allow faster lookup when traversing each row.
   */
  public addRangeOutlines(): void {
    for (let i = 0; i < this.sensors.length; i++) {
      const sensor = this.sensors[i]
      const { closestBeacon: beacon, x, y } = sensor
      const distance = getManhattanDistance(sensor, beacon)
      let radius = 0

      for (let j = 0; j < distance * 2 + 1; j++) {
        const yAdjusted = y - distance + j
        const xMinMax: xMinMax = { fromX: x - radius, toX: x + radius }

        if (this.outlineMap[yAdjusted] === undefined) {
          this.outlineMap[yAdjusted] = [xMinMax]
        }
        else {
          this.outlineMap[yAdjusted].push(xMinMax)
        }

        // go from 0 to distance and back to 0:
        if (j < distance) radius += 1
        else radius -= 1
      }
    }
  }

  /**
   * Gets count of empty cells for a given row.
   * Merges the lines x min-max values where possible,
   * and returns their sum minusthe amount of sensors/beacons
   * on this line.
   *
   * @param y - Row to count
   * @returns Amount of empty cells on row
   */
  public getEmptyCellCount(y: number): number {
    const xMinMaxList = this.outlineMap[y].sort((a, b) => a.fromX - b.fromX)
    const pairs: xMinMax[] = []

    for (let i = 0; i < xMinMaxList.length; i++) {
      const { fromX, toX } = xMinMaxList[i]

      if (pairs.length === 0) {
        pairs.push({ fromX, toX })
        continue
      }
      const lastPair = pairs[pairs.length - 1]
      const doesConnect = fromX <= lastPair.toX
      // merge them together if connected
      if (doesConnect && lastPair.toX < toX) {
        lastPair.toX = toX
      }
      else if (!doesConnect) {
        pairs.push({ fromX, toX })
      }
    }
    const devicesOnThisRow = this.getDevicesOnRow(y).filter(device =>
      pairs.some(pair => pair.fromX <= device.x && pair.toX >= device.x)
    )
    return pairs.reduce(
      (result, { fromX, toX }) => result + toX - fromX + 1,
      -devicesOnThisRow.length
    )
  }

  private getDevicesOnRow(y: number): (Sensor | Beacon)[] {
    return [...this.sensors, ...this.beacons].filter(device => device.y === y)
  }

  /**
   * Gets the grid range based on either actual coordinates,
   * or cut within boundaries.
   */
  private getRanges(withBoundaries = false) {
    return {
      yStart: withBoundaries ? this.yMinBoundaries : this.yMin,
      yEnd: withBoundaries ? this.yMaxBoundaries : this.yMax,
      xStart: withBoundaries ? this.xMinBoundaries : this.xMin,
      xEnd: withBoundaries ? this.xMaxBoundaries : this.xMax,
    }
  }

  /** Finds the highest/lowest possible values for the grid x/y axis. */
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
   * Stringifies grid for printing.
   * Only meant to be used for relatively small coordinate systems.Prints
   *
   * @param mode - Whether to print only the outlines of sensor ranges,
   * or also all empty cells within
   * @param withBoundaries - Whether to cut the grid according to
   * boundaries or not
   * @returns Stringified grid
   */
  public stringifyGrid(
    mode: 'full' | 'outlines' = 'full',
    withBoundaries = false
  ): string {
    if (noLog && !visualize) return ''
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
   * Returns a stringifiable grid of beacons, sensors, and all of the
   * known empty cells within their range.
   * Only meant to be used for relatively small coordinate systems.
   *
   * @param withBoundaries - Whether to cut the grid according to
   * boundaries or not
   * @returns Stringifiable grid including all empty cells
   */
  private getFullGrid(withBoundaries = false): string[][] {
    const { yStart, yEnd, xStart, xEnd } = this.getRanges(withBoundaries)
    const grid = []
    for (let y = yStart; y < yEnd; y++) {
      const row = []
      const devices = this.getDevicesOnRow(y)
      const yAdjusted = y + (withBoundaries ? yStart : 0)
      const xMinMaxList = this.outlineMap[yAdjusted]
      for (let x = xStart; x < xEnd; x++) {
        const xAdjusted = x + (withBoundaries ? xStart : 0)
        let marker = '.'
        const device = devices.find(device => device.x === xAdjusted)
        if (device !== undefined) {
          marker = device.type === 'sensor' ? 'S' : 'B'
        }
        else if (
          xMinMaxList.some(
            ({ fromX, toX }) => xAdjusted >= fromX && xAdjusted <= toX
          )
        ) {
          marker = '#'
        }
        row.push(marker)
      }
      grid.push(row)
    }
    return grid
    return []
  }

  /**
   * Returns a stringifiable grid of beacons, sensors, and the range of their outlines.
   * Only meant to be used for relatively small coordinate systems.
   *
   * @param withBoundaries - Whether to cut the grid according to
   * boundaries or not
   * @returns Stringifiable grid with range outlines
   */
  private getOutlineGrid(withBoundaries = false): string[][] {
    const { yStart, yEnd, xStart, xEnd } = this.getRanges(withBoundaries)
    const grid = []

    for (let y = yStart; y < yEnd; y++) {
      const yAdjusted = y + (withBoundaries ? yStart : 0)
      const boundaryPairs = this.outlineMap[yAdjusted]
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

/** Finds the highest/lowest value for a given axis on a list of coordinates. */
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

function formatTimeDuration(fromMs: number, toMs: number): string {
  return `${Math.round((toMs - fromMs) / 1000)}s`
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
