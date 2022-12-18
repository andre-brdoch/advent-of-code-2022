interface Solution15 {
  answer1: number
}
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
type Cell = '.' | 'S' | 'B'
type CaveGrid = Cell[][]

export default async function solution(input: string): Promise<Solution15> {
  console.log(input)
  console.log('----')

  const sensors = parseSensors(input)
  const cave = new Cave(sensors)
  console.log(cave.grid)
  console.log(cave.toString())

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

  public toString(): string {
    let string = ''
    for (let i = 0; i < this.grid[0].length; i++) {
      string += '\n'
      for (let j = 0; j < this.grid.length; j++) {
        string += this.grid[j][i] + ' '
      }
    }
    return string
  }

  private getInitialCave(): CaveGrid {
    const combined = [...this.sensors, ...this.beacons]
    const width = getExtremeCoordinate(combined, 'x', 'max') + 1
    const height = getExtremeCoordinate(combined, 'y', 'max') + 1
    const cave: CaveGrid = Array.from(Array(width)).map(() =>
      Array.from(Array(height)).map(() => '.')
    )
    combined.forEach(({ x, y, type }) => {
      cave[x][y] = type === 'sensor' ? 'S' : 'B'
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
