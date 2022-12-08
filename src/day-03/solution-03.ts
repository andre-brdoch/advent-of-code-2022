type Answer1 = number
type Answer2 = number
interface Solution3 {
  answer1: Answer1
  answer2: Answer2
}

const LOWER_A_ASCII_CODE = 97
const UPPER_A_ASCII_CODE = 65
const ALPHABET_NUMBERS = 26

export default async function solution(input: string): Promise<Solution3> {
  console.log(input)
  console.log('---')
  const answer1 = getAnswer1(input)
  const answer2 = getAnswer2(input)
  return { answer1, answer2 }
}

function getAnswer1(input: string): Answer1 {
  const bags = parseBags(input)
  const duplicates = bags.map(bag => findCommon(bag[0], bag[1]))
  const priorities = duplicates.map(getPriority)
  return getSum(priorities)
}

function getAnswer2(input: string): Answer2 {
  const groups = parseGroups(input)
  //   const duplicates = bags.map(bag => findCommon(bag[0], bag[1]))
  //   const priorities = duplicates.map(getPriority)
  console.log(groups)
  //   console.log(duplicates)
  //   console.log(priorities)
  //   return getSum(priorities)
  return 0
}

function getSum(numbers: number[]): number {
  return numbers.reduce((result, current) => result + current, 0)
}

function getPriority(char: string): number {
  const asciiCode = char.charCodeAt(0)
  const isUpperCase = asciiCode < LOWER_A_ASCII_CODE
  const offset =
    (isUpperCase ? UPPER_A_ASCII_CODE - ALPHABET_NUMBERS : LOWER_A_ASCII_CODE) -
    1
  return asciiCode - offset
}

function findCommon(...lists: string[][]): string {
  const map: { [key: string]: { [key: string]: true } } = {}
  let duplicate: string | undefined = undefined

  outerLoop: for (let i = 0; i < lists.length; i += 1) {
    const list = lists[i]
    for (let j = 0; j < list.length; j += 1) {
      const key = list[j]
      if (map[key] === undefined) map[key] = {}
      // save hit for current list
      map[key][i] = true
      // if last list and all lists had current char in common
      if (
        i === lists.length - 1 &&
        Object.keys(map[key]).length === lists.length
      ) {
        duplicate = key
        break outerLoop
      }
    }
  }

  if (duplicate === undefined) throw new Error('The elf packed too well.')
  return duplicate
}

function parseBags(input: string): string[][][] {
  return input.split('\n').map(line => {
    const chars = Array.from(line)
    const halfSize = chars.length / 2
    const compartmentA: string[] = chars.slice(0, halfSize)
    const compartmentB: string[] = chars.slice(chars.length / 2)
    if (compartmentA.length !== compartmentB.length) {
      throw new Error(
        `Both compartments must have the same amount of items, has ${compartmentA.length} and ${compartmentB.length}.`
      )
    }
    return [compartmentA, compartmentB]
  })
}

function parseGroups(input: string): string[][] {
  return input.split('\n').reduce(
    (result, line) => {
      const lastGroup = result[result.length - 1]
      if (lastGroup.length < 3) {
        lastGroup.push(line)
      }
      else {
        result.push([line])
      }
      return result
    },
    [[]] as string[][]
  )
}
