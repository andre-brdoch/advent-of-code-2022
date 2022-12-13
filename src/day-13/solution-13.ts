interface Solution13 {
  answer1: number
}
type ValueOrArray<T> = T | ValueOrArray<T>[]
type Value = ValueOrArray<number>
type Packet = Value[]
type Group = [Packet, Packet]

export default async function solution(input: string): Promise<Solution13> {
  console.log(input)
  console.log('-----')

  const groups = parseGroups(input)
  console.log(groups)

  return { answer1: 0 }
}

function parseGroups(input: string): Group[] {
  return input.split('\n\n').map(groupLines =>
    // I know this is cheating :)
    groupLines.split('\n').map(line => eval(line))
  ) as Group[]
}
