interface Solution3 {
  answer1: number
}
type Compartment = string[]
type Bag = [Compartment, Compartment]

const LOWER_A_ASCII_CODE = 97
const UPPER_A_ASCII_CODE = 65
const ALPHABET_NUMBERS = 26

export default async function solution(input: string): Promise<Solution3> {
  console.log(input)
  console.log('---')
  const bags = parseBags(input)
  const duplicates = bags.map(findDuplicate)
  const priorities = duplicates.map(getPriority)
  console.log(bags)
  console.log(duplicates)
  console.log(priorities)
  const answer1 = getSum(priorities)

  return { answer1 }
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

function findDuplicate(bag: Bag): string {
  const map: { [key: string]: true } = {}
  const [compartmentA, compartmentB] = bag
  compartmentA.forEach(key => {
    map[key] = true
  })
  const duplicate = compartmentB.find(key => map[key] === true)
  if (duplicate === undefined) throw new Error('The elf packed too well.')
  return duplicate
}

function parseBags(input: string): Bag[] {
  return input.split('\n').map(line => {
    const chars = Array.from(line)
    const halfSize = chars.length / 2
    const compartmentA: Compartment = chars.slice(0, halfSize)
    const compartmentB: Compartment = chars.slice(chars.length / 2)
    if (compartmentA.length !== compartmentB.length) {
      throw new Error(
        `Both compartments must have the same amount of items, has ${compartmentA.length} and ${compartmentB.length}.`
      )
    }
    return [compartmentA, compartmentB]
  })
}
