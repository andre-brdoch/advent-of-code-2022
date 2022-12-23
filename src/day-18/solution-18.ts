interface Solution18 {
  answer1: number
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
type Boundary = keyof Boundaries

const ALL_AXES: Axis[] = ['x', 'y', 'z']

export default async function solution(input: string): Promise<Solution18> {
  const cubes = parseCubes(input)
  const boundaries = getBoundingCube(cubes)
  const grid = buildGrid(cubes, boundaries)

  const answer1 = getSurfaceArea(grid, boundaries)

  console.log('\ngrid:')
  grid.forEach(row => console.log(row))

  // console.log('\ncube:')
  // console.log(cubes[0])
  // console.log('neighbors:')
  // console.log(getNeighboringCoordinates(cubes[0]))
  // console.log(getNeighbors(cubes[0], grid, boundaries))

  return { answer1 }
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

function getSurfaceArea(grid: Grid, boundaries: Boundaries): number {
  return grid
    .flat(2)
    .filter(cube => cube.type === 'lava')
    .reduce(
      (result, cube) =>
        6 -
        getNeighbors(cube, grid, boundaries).filter(
          neighbor => neighbor !== null && neighbor.type === 'lava'
        ).length +
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

// todo: need to normalize coords
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
  console.log(`max: ${maxX}/${maxY}/${maxZ}`)
  console.log(`min: ${minX}/${minY}/${minZ}`)
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

function parseCubes(input: string): Cube[] {
  return input
    .split('\n')
    .map(line => line.split(',').map(str => Number(str)))
    .map(([x, y, z]) => ({ x, y, z, type: 'lava' }))
}
