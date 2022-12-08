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

  return { answer1: 0 }
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
