import { parseArgs } from '../utils/env-helpers.js'
import { isOnGrid } from './utils.js'
import { Coordinate, Axis, Facing, Grid, Plane, PlaneEdge } from './types'

const { isTest } = parseArgs()

const PLANE_SIZE = isTest ? 4 : 50

export function getPlanes(grid: Grid): Plane[] {
  const planes: Plane[] = []
  let name = 1

  // unfolded die must fit into a 4x4 grid
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      // is plane if not empty
      if (
        isOnGrid(grid, {
          x: x * PLANE_SIZE,
          y: y * PLANE_SIZE,
        }) &&
        grid[y * PLANE_SIZE][x * PLANE_SIZE].type !== ' '
      ) {
        const plane = {} as Plane
        plane.name = name.toString()
        plane.x = x
        plane.y = y
        plane.z = 0
        plane.edges = {
          '^': {
            from: { x: 0 + x, y: 0 + y },
            to: { x: 1 + x, y: 0 + y },
            planes: [plane],
          },
          '>': {
            from: { x: 1 + x, y: 0 + y },
            to: { x: 1 + x, y: 1 + y },
            planes: [plane],
          },
          "v": {
            from: { x: 0 + x, y: 1 + y },
            to: { x: 1 + x, y: 1 + y },
            planes: [plane],
          },
          '<': {
            from: { x: 0 + x, y: 0 + y },
            to: { x: 0 + x, y: 1 + y },
            planes: [plane],
          },
        }
        planes.push(plane)

        name += 1
      }
    }
  }

  return planes
}
