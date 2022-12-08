interface Solution3 {
  answer1: number
}
type Compartment = string[]
type Bag = [Compartment, Compartment]

export default async function solution(input: string): Promise<Solution3> {
  console.log(input)
  console.log('---')
  const bags = parseBags(input)
  console.log(bags)

  return { answer1: 0 }
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
