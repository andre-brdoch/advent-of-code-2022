import { parseArgs } from '../utils/env-helpers.js'
import { Facing, Coordinate } from './types'

const { isTest } = parseArgs()

export const PLANE_SIZE = isTest ? 4 : 50

export const INITIAL_FACING: Facing = '>'

export const VECTORS: { [facing: string]: Coordinate } = {
  '^': { x: 0, y: 1 },
  '>': { x: 1, y: 0 },
  "v": { x: 0, y: -1 },
  '<': { x: -1, y: 0 },
}

export const UPPER_A_ASCII_CODE = 65
