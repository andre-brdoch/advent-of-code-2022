import { isOnGrid, coordinatesOverlap } from './utils.js'
import { PLANE_SIZE } from './constants.js'
import { Coordinate, Axis, Facing, Grid, Plane, PlaneEdge } from './types'

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
            from: { x: 0 + x, y: 0 + y, z: 0 },
            to: { x: 1 + x, y: 0 + y, z: 0 },
            planes: [plane],
          },
          '>': {
            from: { x: 1 + x, y: 0 + y, z: 0 },
            to: { x: 1 + x, y: 1 + y, z: 0 },
            planes: [plane],
          },
          "v": {
            from: { x: 0 + x, y: 1 + y, z: 0 },
            to: { x: 1 + x, y: 1 + y, z: 0 },
            planes: [plane],
          },
          '<': {
            from: { x: 0 + x, y: 0 + y, z: 0 },
            to: { x: 0 + x, y: 1 + y, z: 0 },
            planes: [plane],
          },
        }
        planes.push(plane)

        name += 1
      }
    }
  }

  mergeOverlappingEdges(planes)

  return planes
}

function mergeOverlappingEdges(planes: Plane[]): Plane[] {
  const edges = getAllEdges(planes)
  console.log('EDGES')
  console.log(edges)
  console.log(edges.length)

  const remaining = [...edges]
  remaining.forEach(edge => {
    const otherEdge = remaining.find(
      otherEdge => otherEdge !== edge && edgesOverlap(edge, otherEdge)
    )
    if (otherEdge) {
      const otherPlane = otherEdge.planes[0]
      const otherFacing = (Object.keys(otherPlane.edges) as Facing[]).find(
        key => otherPlane.edges[key] === otherEdge
      ) as Facing
      console.log('found other!!')

      edge.planes.push(otherPlane)
      otherPlane.edges[otherFacing] = edge

      // don't process the matched edge a 2nd time:
      const i = remaining.indexOf(otherEdge)
      remaining.splice(i, 1)
    }
  })

  const x = getAllEdges(planes)
  console.log(x.length)

  return planes
}

function getAllEdges(planes: Plane[]): PlaneEdge[] {
  const edges = planes.reduce((result, plane) => {
    ;(Object.keys(plane.edges) as Facing[])
      .map(key => plane.edges[key])
      .forEach(edge => {
        result.add(edge)
      })
    return result
  }, new Set<PlaneEdge>())
  return [...edges]
}

function edgesOverlap(a: PlaneEdge, b: PlaneEdge) {
  return (
    // same arrow
    (coordinatesOverlap(a.from, b.from) && coordinatesOverlap(a.to, b.to)) ||
    // reversed arrow
    (coordinatesOverlap(a.from, b.to) && coordinatesOverlap(a.to, b.from))
  )
}
