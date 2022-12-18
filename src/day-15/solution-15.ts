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
interface EmptyCell extends Coordinate {
  type: 'empty'
}
type Cell = Sensor | Beacon | EmptyCell
type CaveGrid = Cell[][]

export default async function solution(input: string): Promise<Solution15> {
  console.log(input)
  console.log('----')

  const sensors = parseSensors(input)
  const cave = new Cave(sensors)
  console.log(sensors)
  console.log(cave.toString())

  console.log(getManhattanDistance(sensors[0], sensors[0].closestBeacon))
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
        const type = this.grid[j][i].type
        const marker = type === 'sensor' ? 'S' : type === 'beacon' ? 'B' : '.'
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
        type: 'empty',
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
