interface Solution13 {
  answer1: number
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

  const groups = parseGroups(input)
  console.log(groups)
  const successIndices = getSuccessfullIndices(groups)
  console.log(successIndices)
  const answer1 = getSum(successIndices)

  return { answer1 }
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

function parseGroups(input: string): Group[] {
  return input.split('\n\n').map(groupLines =>
    // I know this is cheating :)
    groupLines.split('\n').map(line => eval(line))
  ) as Group[]
}
