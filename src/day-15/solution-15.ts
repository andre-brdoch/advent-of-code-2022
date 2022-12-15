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

export default async function solution(input: string): Promise<Solution15> {
  console.log(input)
  console.log('----')

  const sensors = parseSensors(input)
  const cave = new Cave(sensors)
  cave.toString()

  return { answer1: 0 }
}

class Cave {
  private sensors
  private beacons

  constructor(sensors: Sensor[]) {
    const beacons = sensors.map(sensor => sensor.closestBeacon)
    const { offsetX, offsetY } = getNormalizeOffset([...sensors, ...beacons])
    this.sensors = sensors.map(sensor =>
      normalizeCoordinate(sensor, offsetX, offsetY)
    )
    this.beacons = beacons.map(sensor =>
      normalizeCoordinate(sensor, offsetX, offsetY)
    )
  }

  public toString() {
    console.log('this.sensors')
    console.log(this.sensors)
    console.log('this.beacons')
    console.log(this.beacons)
  }

  private getInitialCave() {
    //
  }
}

/** Get offset for normalization */
function getNormalizeOffset(coordinates: Coordinate[]): {
  offsetX: number
  offsetY: number
} {
  const flatCoordinates = coordinates.flat()
  const xMin = getExtremeCoordinate(flatCoordinates, 'x', 'min')
  const yMin = getExtremeCoordinate(flatCoordinates, 'y', 'min')
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
): Coordinate {
  const { x, y } = coordinate
  return { x: x + offsetX, y: y + offsetY }
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
