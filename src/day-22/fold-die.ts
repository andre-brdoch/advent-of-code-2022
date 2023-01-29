import { PLANE_SIZE } from './constants.js'
import { isOnGrid, coordinatesOverlap } from './utils.js'
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
  let number = 1

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
        plane.name = number.toString()
        plane.x = x
        plane.y = y
        plane.z = 0
        plane.edges = {
          '^': {
            from: { x: 0 + x, y: 1 + y, z: 0 },
            to: { x: 1 + x, y: 1 + y, z: 0 },
            planes: [plane],
          },
          '>': {
            from: { x: 1 + x, y: 0 + y, z: 0 },
            to: { x: 1 + x, y: 1 + y, z: 0 },
            planes: [plane],
          },
          "v": {
            from: { x: 0 + x, y: 0 + y, z: 0 },
            to: { x: 1 + x, y: 0 + y, z: 0 },
            planes: [plane],
          },
          '<': {
            from: { x: 0 + x, y: 0 + y, z: 0 },
            to: { x: 0 + x, y: 1 + y, z: 0 },
            planes: [plane],
          },
        }
        planes.push(plane)

        number += 1
      }
    }
  }

  planes.forEach(plane => {
    console.log(plane)
  })

  mergeOverlappingEdges(planes)
  fold(planes)

  return planes
}

function fold(planes: Plane[]): void {
  // const from = { x: 1, y: 2, z: 0 }
  // const axis = 'z'
  // const angle = 90
  // const result = rotateAroundAxis(from, angle, axis)
  // console.log('from:', from)
  // console.log(`rotated ${angle} degrees around ${axis} axis:`, result)

  // return
  const foldableEdges = getAllEdges(planes).filter(edgeIsFoldable)
  console.log(foldableEdges)

  // // foldableEdges.forEach(edge => foldEdge(edge, 90))

  // console.log('before')
  // console.log(foldableEdges[3])
  // foldEdge(foldableEdges[0], 90)
  // console.log('1 fold')
  // console.log(foldableEdges[3])
  // foldEdge(foldableEdges[1], 90)
  // console.log('2 fold')
  // console.log(foldableEdges[3])
  // foldEdge(foldableEdges[2], 90)
  // console.log('3 fold')
  // console.log(foldableEdges[3])
  // foldEdge(foldableEdges[3], 90)
  // console.log('4 fold')
  // console.log(foldableEdges[3])
  // foldEdge(foldableEdges[4], -90)
  // console.log('after')
  // console.log(foldableEdges[3])
  // mergeOverlappingEdges(planes)
  // console.log(getAllEdges(planes))
  // console.log(getAllEdges(planes).length)

  foldableEdges.forEach(edge => {
    console.log(edge.planes)
    foldEdge(edge, 90)
    mergeOverlappingEdges(planes)
  })
  console.log(getAllEdges(planes).length)
}

function foldEdge(edge: PlaneEdge, angle: number): void {
  // determine if x/y/z rotation
  const rotatationAxis = parallelAxisOfEdge(edge)
  if (rotatationAxis === null) throw new Error('Not parallel to any axis')
  // pick one side to be folded
  const [, plane] = edge.planes
  // find all edges affected by the fold
  const otherEdges = findEdgesToFold(plane, edge)
  // reference point from rotation axis used for moving to origin and back
  const referencePoint = { ...edge.from }

  // update coordinates of each affected edge
  otherEdges.forEach(otherEdge => {
    ;[otherEdge.from, otherEdge.to].forEach(point => {
      // move to origin
      const pointInOrigin = substractVectors(point, referencePoint)
      // rotate
      const pointInOriginRotated = rotateAroundAxis(
        pointInOrigin,
        angle,
        rotatationAxis
      )
      // move back
      const pointRotated = addVectors(pointInOriginRotated, referencePoint)
      point.x = pointRotated.x
      point.y = pointRotated.y
      point.z = pointRotated.z
    })
  })
}

function findEdgesToFold(
  cameFromPlane: Plane,
  cameFromEdge: PlaneEdge
): PlaneEdge[] {
  const startingVal: PlaneEdge[] = []
  return (Object.keys(cameFromPlane.edges) as Facing[])
    .map(key => cameFromPlane.edges[key])
    .filter(otherEdge => otherEdge !== cameFromEdge)
    .reduce((result, otherEdge) => {
      const newPlane = otherEdge.planes.find(plane => plane !== cameFromPlane)
      if (newPlane === undefined) return [...result, otherEdge]
      return [...result, otherEdge, ...findEdgesToFold(newPlane, otherEdge)]
    }, startingVal)
}

function mergeOverlappingEdges(planes: Plane[]): void {
  const edges = getAllEdges(planes)
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

      edge.planes.push(otherPlane)
      otherPlane.edges[otherFacing] = edge

      // don't process the matched edge a 2nd time:
      const i = remaining.indexOf(otherEdge)
      remaining.splice(i, 1)
    }
  })
}

function getAllEdges(planes: Plane[]): PlaneEdge[] {
  const edges = planes.reduce((result, plane) => {
    ;(Object.keys(plane.edges) as Facing[])
      .map(key => plane.edges[key])
      .forEach(edge => {
        result.add(edge)
      })
    return result
    // remove duplicates
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

/** Returns the center point between 2 planes, created by the folding of an edge */
function getCenterPoint(edge: PlaneEdge): Coordinate3D {
  const edges = edge.planes.reduce(
    (result, plane) => [...result, ...getAllEdges([plane])],
    [] as PlaneEdge[]
  )
  const points = edges.reduce(
    (result, edge) => [...result, ...[edge.from, edge.to]],
    [] as Coordinate3D[]
  )
  const minMaxPoints = points.reduce((result, point) => {
    ;(Object.keys(point) as (keyof Coordinate3D)[]).forEach(axis => {
      if (result[axis] === undefined) {
        result[axis] = {
          min: point[axis],
          max: point[axis],
        }
      }
      else if (point[axis] < result[axis].min) {
        result[axis].min = point[axis]
      }
      else if (point[axis] > result[axis].max) {
        result[axis].max = point[axis]
      }
    })
    return result
  }, {} as Record<keyof Coordinate3D, { min: number; max: number }>)
  return (Object.keys(minMaxPoints) as (keyof Coordinate3D)[]).reduce(
    (result, axis) => ({
      ...result,
      [axis]: (minMaxPoints[axis].min + minMaxPoints[axis].max) / 2,
    }),
    {} as Coordinate3D
  )
}

/** Returns the name of the axis an edge is parallel to, or null */
function parallelAxisOfEdge(edge: PlaneEdge): keyof Coordinate3D | null {
  const diffVector = substractVectors(edge.from, edge.to)
  const changedAxes =
    (Object.keys(diffVector) as Array<keyof Coordinate3D>).filter(
      axis => diffVector[axis] !== 0
    ) ?? null
  return changedAxes.length === 1 ? changedAxes[0] : null
}

function rotateAroundAxis(
  coordinate: Coordinate3D,
  angle: number,
  axis: keyof Coordinate3D
) {
  let rotationMatrix
  const radianAngle = angleToRadian(angle)
  switch (axis) {
  case 'y':
    rotationMatrix = [
      [cos(radianAngle), 0, -sin(radianAngle)],
      [0, 1, 0],
      [sin(radianAngle), 0, cos(radianAngle)],
    ]
    break
  case 'z':
    rotationMatrix = [
      [cos(radianAngle), sin(radianAngle), 0],
      [-sin(radianAngle), cos(radianAngle), 0],
      [0, 0, 1],
    ]
    break
  case 'x':
  default:
    rotationMatrix = [
      [1, 0, 0],
      [0, cos(radianAngle), -sin(radianAngle)],
      [0, sin(radianAngle), cos(radianAngle)],
    ]
  }
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

function addVectors(a: Coordinate3D, b: Coordinate3D): Coordinate3D {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  }
}

function substractVectors(a: Coordinate3D, b: Coordinate3D): Coordinate3D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
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
