/**
 * FOLDING ALGORITHM:
 *
 * Generically folds any unfolded die together, by following these steps:
 *
 * 1. Determine all die planes end edges. Every edge will eventually be connecting
 *    two different planes, however, at this steps only 5 edges will know both of their planes.
 * 2. Fold 1 arbitrary edge of the 5 foldable edges. 1 of its 2 planes (and all planes
 *    connected to that one) will move and update their coordinates
 * 3. Remember the center point of the die, whichs early shape is now established by the
 *    two planes directly connected to the folded edge.
 * 4. Mark both planes directly connected to the folded edge as in their final position.
 *    They should not update coordinates anymore moving forward.
 * 5. Repeat until there is no more unfolded edges:
 *       5.1. Find the unfolded edge whichs center is the closest to the center of the die.
 *       5.2. Fold it by 90 degrees. Use the plane that is not yet in its final position
 *            as the one that is being moved (the other ones stays as it was).
 *       5.3. Measure the folded planes distance to the center of the die.
 *            If it is larger than 0.5, then we folded into the wrong direction,
 *            and we correct by folding by -180 degrees.
 *       5.4. Mark this plane as also in its final position.
 *            It should not move anymore in the future.
 * 6. Merge all edges that are overlapping. Now all six planes should be connected to 4 edges each,
 *    and all 12 edges connected to 2 planes each.
 * 7. The die is now correctly folded!
 */

import { PLANE_SIZE } from './constants.js'
import { isOnGrid, coordinatesOverlap, stringifyPlanes } from './utils.js'
import { Coordinate3D, Facing, Grid, Plane, PlaneEdge } from './types'
import { Logger } from '../utils/Logger.js'

const logger = new Logger()

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

  mergeOverlappingEdges(planes)
  fold(planes)

  return planes
}

function fold(planes: Plane[]): void {
  logger.log(`\nFold die with the following unfolded shape:\n`)
  logger.log(stringifyPlanes(planes))

  const foldableEdges = getAllEdges(planes).filter(edgeIsFoldable)

  const firstEdge = foldableEdges.shift() as PlaneEdge
  foldEdge(firstEdge, 90)
  firstEdge.planes.forEach(plane => {
    plane.finalPosition = true
  })

  // place the center between the 2 folded planes, to help
  // determine fold direction for all following edges
  const pointBetween = getCenterOf2FoldedPlanes(firstEdge)

  // for each remaining edge, find the one currently closest to the center
  // of the die, and fold. If after folding the distance the plane is not
  // 0.5, then we folded into the wrong direction, and instead have to do
  // it into the other direction:
  while (foldableEdges.length !== 0) {
    const edge = getEdgeClosestToPoint(pointBetween, foldableEdges)
    foldableEdges.splice(foldableEdges.indexOf(edge), 1)
    foldEdge(edge, 90)
    if (
      edge.planes.some(
        plane =>
          // planes that are in their final position will have a distance of 0.5 to the die center
          getDistanceBetweenPoints(getCenterOfPlane(plane), pointBetween) !==
          0.5
      )
    ) {
      // was folded in wrong direction, reverse and fold into other direction
      foldEdge(edge, -180)
    }
    edge.planes.forEach(plane => {
      plane.finalPosition = true
    })
  }
  mergeOverlappingEdges(planes)
}

/**
 * Folds edge by an angle.
 * Can provide `centerPoint` for determining which side of the edge should not be moved
 */
function foldEdge(edge: PlaneEdge, angle: number): void {
  // determine if x/y/z rotation
  const rotatationAxis = parallelAxisOfEdge(edge)
  if (rotatationAxis === null) throw new Error('Not parallel to any axis')
  // pick side that is not yet in final position
  const plane = edge.planes.filter(plane => !plane.finalPosition)[0]
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

function getEdgeClosestToPoint(
  point: Coordinate3D,
  edges: PlaneEdge[]
): PlaneEdge {
  const withDistances = edges.map(edge => {
    const edgeCenter = getCenterOfEdge(edge)
    const distance = getDistanceBetweenPoints(point, edgeCenter)
    return {
      edge,
      distance,
    }
  })
  return withDistances.sort((a, b) => a.distance - b.distance)[0].edge
}

function getDistanceBetweenPoints(a: Coordinate3D, b: Coordinate3D): number {
  const sumVector = substractVectors(a, b)
  return Math.sqrt(
    Math.pow(sumVector.x, 2) +
      Math.pow(sumVector.y, 2) +
      Math.pow(sumVector.z, 2)
  )
}

/** Returns the center point between 2 planes, created by the folding of an edge */
function getCenterOf2FoldedPlanes(edge: PlaneEdge): Coordinate3D {
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

/** Returns the center on a plane */
function getCenterOfPlane(plane: Plane): Coordinate3D {
  const edgeCenters = getAllEdges([plane]).map(getCenterOfEdge)
  const summedEdgeCenter = edgeCenters.reduce(
    (result, point) => addVectors(result, point),
    { x: 0, y: 0, z: 0 } as Coordinate3D
  )
  return (Object.keys(summedEdgeCenter) as (keyof Coordinate3D)[]).reduce(
    (result, axis) => ({
      ...result,
      [axis]: summedEdgeCenter[axis] / 4,
    }),
    {} as Coordinate3D
  )
}

/** Returns the center on an edge */
function getCenterOfEdge(edge: PlaneEdge): Coordinate3D {
  const sumVector = addVectors(edge.from, edge.to)
  return (Object.keys(sumVector) as (keyof Coordinate3D)[]).reduce(
    (result, axis) => ({
      ...result,
      [axis]: sumVector[axis] / 2,
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
