interface Solution13 {
  answer1: number
  answer2: number
}
type ValueOrArray<T> = T | ValueOrArray<T>[]
type Value = ValueOrArray<number>
type ValueList = Value[]
type Packet = Value[]
type Group = [Packet, Packet]
type CompareResult = 1 | -1 | 0

export default async function solution(input: string): Promise<Solution13> {
  console.log(input)
  console.log('-----')

  const answer1 = getAnswer1(input)
  const answer2 = getAnswer2(input)

  return { answer1, answer2 }
}

function getAnswer1(input: string): number {
  const groups = parseFile(input, true)
  const successIndices = getSuccessfullIndices(groups)
  return getSum(successIndices)
}

function getAnswer2(input: string): number {
  const packets = parseFile(input, false)
  console.log(packets)

  const sorted = packets.sort((a, b) => compareLists(b, a))
  console.log(sorted)
  return 0
}

function compareLists(
  leftList: ValueList,
  rightList: ValueList
): CompareResult {
  for (let i = 0; i < Math.max(leftList.length, rightList.length); i++) {
    const leftRanOut = i === leftList.length
    const rightRanOut = i === rightList.length

    if (leftRanOut && rightRanOut) return 0
    else if (leftRanOut) return 1
    else if (rightRanOut) return -1
    else {
      const leftVal = leftList[i]
      const rightVal = rightList[i]
      const comparison: CompareResult = compareValues(leftVal, rightVal)
      if (comparison !== 0) return comparison
    }
  }
  return 0
}

function compareValues(leftVal: Value, rightVal: Value): CompareResult {
  if (typeof leftVal === 'number' && typeof rightVal === 'number') {
    if (leftVal > rightVal) return -1
    if (leftVal < rightVal) return 1
    return 0
  }
  const leftList = ensureArray(leftVal)
  const rightList = ensureArray(rightVal)
  return compareLists(leftList, rightList)
}

function getSuccessfullIndices(groups: Group[]): number[] {
  return groups
    .map(([left, right], i) => ({
      comparison: compareLists(left, right),
      index: i + 1,
    }))
    .filter(({ comparison }) => comparison === 1)
    .map(({ index }) => index)
}

function ensureArray(val: Value) {
  return Array.isArray(val) ? val : [val]
}

function getSum(numbers: number[]): number {
  return numbers.reduce((result, number) => result + number, 0)
}

function parseFile(input: string, grouped: false): Packet[]
function parseFile(input: string, grouped: true): Group[]
function parseFile(input: string, grouped: boolean): Group[] | Packet[] {
  const groups = input.split('\n\n').map(groupLines =>
    // I know this is cheating :)
    groupLines.split('\n').map(line => eval(line))
  ) as Group[]
  return grouped
    ? groups
    : groups.reduce((result, group) => [...result, group], [] as Packet[])
}
