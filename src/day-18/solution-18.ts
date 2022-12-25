interface Solution18 {
  answer1: number
  answer2: number
}
interface Coordinate {
  x: number
  y: number
  z: number
}
interface Cube extends Coordinate {
  type: 'lava' | 'air' | 'water' | 'unknown'
}
type Axis = keyof Coordinate
type Grid = Cube[][][]
interface Boundaries {
  maxX: number
  maxY: number
  maxZ: number
  minX: number
  minY: number
  minZ: number
}

const ALL_AXES: Axis[] = ['x', 'y', 'z']

export default async function solution(input: string): Promise<Solution18> {
  const cubes = parseCubes(input)
  const boundaries = getBoundingCube(cubes)
  const grid = buildGrid(cubes, boundaries)

  const answer1 = getSurfaceArea(grid, boundaries, 'all')

  submergeInWater(grid, boundaries)

  console.log('air:')
  console.log(grid.flat(2).filter(cube => cube.type === 'air').length)
  console.log('water:')
  console.log(grid.flat(2).filter(cube => cube.type === 'water').length)
  console.log('lava:')
  console.log(grid.flat(2).filter(cube => cube.type === 'lava').length)

  console.log('all:')
  console.log(grid.flat(2).length)

  const answer2 = getSurfaceArea(grid, boundaries, 'outer')

  return { answer1, answer2 }
}

function submergeInWater(grid: Grid, boundaries: Boundaries): void {
  let unknownCubes = getUnknownCubes(grid)

  // repeat until type of every cube is known
  while (unknownCubes.length > 0) {
    // Pick an unknown cube and do a breath-first search to find all connected fields.
    // Unknown fields must always be water or air.
    // If any field of the searched batch is on the outer layer of the bounding cube,
    // then it must be made of water, and so must be all the others. Otherwise its air.

    const start = unknownCubes[0]
    if (start === undefined) break
    const frontier: Cube[] = [start]
    const reached: { [key: string]: Cube } = {
      [stringifyCoordinate(start)]: start,
    }
    let current: Cube | undefined
    let isWater = false

    while (frontier.length) {
      current = frontier.shift()
      if (current === undefined) break
      const neighbors = getNeighbors(current, grid, boundaries).filter(
        c => c?.type === 'unknown'
      )
      neighbors.forEach(next => {
        if (next === null) return
        const id = stringifyCoordinate(next)
        if (next !== null && !(id in reached)) {
          frontier.push(next)
          reached[id] = next
          // if any cube is placed on the outer layer, it means that it
          // and therefore all other ones connected to it must be water.
          if (isOnOuterLayer(next, boundaries)) {
            isWater = true
          }
        }
      })
    }

    // add the now known cube types
    Object.keys(reached)
      .map(key => reached[key])
      .forEach(cube => {
        cube.type = isWater ? 'water' : 'air'
      })

    unknownCubes = getUnknownCubes(grid)
  }
}

function buildGrid(cubes: Cube[], boundaries: Boundaries): Grid {
  const { maxX, maxY, maxZ, minX, minY, minZ } = boundaries
  const grid: Grid = []
  for (let x = minX; x <= maxX; x++) {
    const row = []
    for (let y = minY; y <= maxY; y++) {
      const column = []
      for (let z = minZ; z <= maxZ; z++) {
        let cube = cubes.find(
          cube => cube.x === x && cube.y === y && cube.z === z
        )
        if (!cube) cube = { x, y, z, type: 'unknown' }
        column.push(cube)
      }
      row.push(column)
    }
    grid.push(row)
  }
  return grid
}

function getSurfaceArea(
  grid: Grid,
  boundaries: Boundaries,
  mode: 'all' | 'outer'
): number {
  return grid
    .flat(2)
    .filter(cube => cube.type === 'lava')
    .reduce(
      (result, cube) =>
        6 -
        getNeighbors(cube, grid, boundaries).filter(neighbor => {
          if (neighbor === null) return false
          const { type } = neighbor
          if (mode === 'outer') {
            // if only counting outer area, ignore any empy air cubes
            return type === 'lava' || type === 'air'
          }
          return type === 'lava'
        }).length +
        result,
      0
    )
}

function getNeighbors(
  cube: Cube,
  grid: Grid,
  boundaries: Boundaries
): (Cube | null)[] {
  return getNeighboringCoordinates(cube).map(coordinate => {
    if (!isOnBoard(coordinate, grid, boundaries)) return null
    const { x, y, z } = coordinate
    const { minX, minY, minZ } = boundaries
    return grid[x - minX][y - minY][z - minZ]
  })
}

function getNeighboringCoordinates(cube: Cube): Coordinate[] {
  return ALL_AXES.flatMap(axis => {
    const otherAxes = ALL_AXES.filter(otherAxis => otherAxis !== axis).reduce(
      (result, otherAxis) => ({ ...result, [otherAxis]: cube[otherAxis] }),
      {} as Coordinate
    )
    const result: Coordinate[] = [-1, 1].map(adjustment => ({
      [axis]: cube[axis] + adjustment,
      ...otherAxes,
    }))
    return result as Coordinate[]
  })
}

function isOnOuterLayer(cube: Cube, boundaries: Boundaries): boolean {
  const { x, y, z } = cube
  const { maxX, maxY, maxZ, minX, minY, minZ } = boundaries
  return (
    x === minX ||
    x === maxX ||
    y === minY ||
    y === maxY ||
    z === minZ ||
    z === maxZ
  )
}

function getUnknownCubes(grid: Grid): Cube[] {
  return grid.flat(2).filter(cube => cube.type === 'unknown')
}

function isOnBoard(
  coordinate: Coordinate,
  grid: Grid,
  boundaries: Boundaries
): boolean {
  const { x, y, z } = coordinate
  const { minX, minY, minZ } = boundaries
  try {
    return !!grid[x - minX][y - minY][z - minZ]
  }
  catch (err) {
    return false
  }
}

function getBoundingCube(cubes: Cube[]): Boundaries {
  let maxX: number | null = null
  let maxY: number | null = null
  let maxZ: number | null = null
  let minX: number | null = null
  let minY: number | null = null
  let minZ: number | null = null
  cubes.forEach(({ x, y, z }) => {
    if (maxX === null || x > maxX) maxX = x
    if (maxY === null || y > maxY) maxY = y
    if (maxZ === null || z > maxZ) maxZ = z
    if (minX === null || x < minX) minX = x
    if (minY === null || y < minY) minY = y
    if (minZ === null || z < minZ) minZ = z
  })
  if (
    maxX === null ||
    maxY === null ||
    maxZ === null ||
    minX === null ||
    minY === null ||
    minZ === null
  ) {
    throw new Error('No bounding cube found')
  }
  return {
    maxX,
    maxY,
    maxZ,
    minX,
    minY,
    minZ,
  }
}

function stringifyCoordinate(coordinate: Coordinate): string {
  const { x, y, z } = coordinate
  return `${x}/${y}/${z}`
}

function parseCubes(input: string): Cube[] {
  return input
    .split('\n')
    .map(line => line.split(',').map(str => Number(str)))
    .map(([x, y, z]) => ({ x, y, z, type: 'lava' }))
}
