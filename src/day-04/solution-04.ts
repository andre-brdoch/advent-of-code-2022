interface Solution4 {
  answer1: number
}
interface Range {
  from: number
  to: number
}
type Pair = [Range, Range]

export default async function solution(input: string): Promise<Solution4> {
  console.log(input)
  console.log('----')
  const pairs = parsePairs(input)
  console.log(pairs)
  pairs.forEach(pair => {
    console.log(pair)
    console.log(pairFullyOverlaps(pair))
    console.log('--')
  })
  const answer1 = countFullyOverlappingPairs(pairs)

  return { answer1 }
}

function countFullyOverlappingPairs(pairs: Pair[]): number {
  return pairs.filter(pair => pairFullyOverlaps(pair)).length
}

function pairFullyOverlaps(pair: Pair): boolean {
  const [left, right] = pair
  return doesAContainB(left, right) || doesAContainB(right, left)
}

function doesAContainB(a: Range, b: Range): boolean {
  return a.from <= b.from && a.to >= b.to
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
