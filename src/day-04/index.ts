import { SolutionFn } from '../types.js'
import { Range, Pair } from './types'

export default (async function solution(input) {
  const pairs = parsePairs(input)

  const answer1 = countFullyOverlappingPairs(pairs)
  const answer2 = countOverlappingPairs(pairs)

  return { answer1, answer2 }
} satisfies SolutionFn)

function countFullyOverlappingPairs(pairs: Pair[]): number {
  return pairs.filter(pair => pairFullyOverlaps(pair)).length
}

function countOverlappingPairs(pairs: Pair[]): number {
  return pairs.filter(pair => pairOverlaps(pair)).length
}

function pairFullyOverlaps(pair: Pair): boolean {
  const [first, second] = pair
  return doesAContainB(first, second) || doesAContainB(second, first)
}

function pairOverlaps(pair: Pair): boolean {
  const [first, second] = pair
  return doesAOverlapB(first, second) || doesAOverlapB(second, first)
}

function doesAContainB(a: Range, b: Range): boolean {
  return a.from <= b.from && a.to >= b.to
}

function doesAOverlapB(a: Range, b: Range): boolean {
  return a.from <= b.from && b.from <= a.to
}

function parsePairs(input: string): Pair[] {
  return input.split('\n').map(
    line =>
      line.split(',').map(rangeString => {
        const [from, to] = rangeString.split('-')
        const range: Range = { from: Number(from), to: Number(to) }
        return range
      }) as Pair
  )
}
