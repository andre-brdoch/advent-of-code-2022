import { isOnGrid, coordinatesOverlap } from './utils.js'
import { PLANE_SIZE } from './constants.js'
import {
  Coordinate,
  Coordinate3D,
  Axis,
  Facing,
  Grid,
  Plane,
  PlaneEdge,
} from './types'

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
  fold(planes)

  return planes
}

function fold(planes: Plane[]): void {
  const foldableEdges = getAllEdges(planes).filter(edgeIsFoldable)
  console.log('foldable:')
  console.log(foldableEdges)

  foldEdge(foldableEdges[0])
}

function foldEdge(edge: PlaneEdge): void {
  const [, plane] = edge.planes
  const otherEdges = (Object.keys(plane.edges) as Facing[])
    .map(key => plane.edges[key])
    .filter(otherEdge => otherEdge !== edge)
  console.log('\ncurrent')
  console.log(edge)
  console.log('nextEdges')
  console.log(otherEdges)

  // todo: rotate other edges
  const nextEdges = otherEdges.filter(edgeIsFoldable)
  // todo: fold next edges
  // nextEdges.forEach(foldEdge)
}

function mergeOverlappingEdges(planes: Plane[]): void {
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

function edgeIsFoldable(edge: PlaneEdge): boolean {
  return edge.planes.length === 2
}

export function rotateX(coordinate: Coordinate3D, angle: number): Coordinate3D {
  const radianAngle = angleToRadian(angle)
  const rotationMatrix = [
    [1, 0, 0],
    [0, cos(radianAngle), -sin(radianAngle)],
    [0, sin(radianAngle), cos(radianAngle)],
  ]
  return rotate(coordinate, rotationMatrix)
}

export function rotateY(coordinate: Coordinate3D, angle: number): Coordinate3D {
  const radianAngle = angleToRadian(angle)
  const rotationMatrix = [
    [cos(radianAngle), 0, -sin(radianAngle)],
    [0, 1, 0],
    [sin(radianAngle), 0, cos(radianAngle)],
  ]
  return rotate(coordinate, rotationMatrix)
}

export function rotateZ(coordinate: Coordinate3D, angle: number): Coordinate3D {
  const radianAngle = angleToRadian(angle)
  const rotationMatrix = [
    [cos(radianAngle), sin(radianAngle), 0],
    [-sin(radianAngle), cos(radianAngle), 0],
    [0, 0, 1],
  ]
  return rotate(coordinate, rotationMatrix)
}

function rotate(
  coordinate: Coordinate3D,
  rotationMatrix: number[][]
): Coordinate3D {
  const { x, y, z } = coordinate
  return {
    x:
      x * rotationMatrix[0][0] +
      y * rotationMatrix[0][1] +
      z * rotationMatrix[0][2],
    y:
      x * rotationMatrix[1][0] +
      y * rotationMatrix[1][1] +
      z * rotationMatrix[1][2],
    z:
      x * rotationMatrix[2][0] +
      y * rotationMatrix[2][1] +
      z * rotationMatrix[2][2],
  }
}

function angleToRadian(angle: number): number {
  return (angle * Math.PI) / 180
}

function sin(radianAngle: number): number {
  return Math.round(Math.sin(radianAngle))
}

function cos(radianAngle: number): number {
  return Math.round(Math.cos(radianAngle))
}
