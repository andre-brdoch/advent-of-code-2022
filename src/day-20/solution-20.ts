interface Solution20 {
  answer1: number
}
interface Item {
  value: number
}
type Sequence = Item[]

export default async function solution(input: string): Promise<Solution20> {
  console.log('before:')
  const items = parseItems(input)
  printItems(items)

  console.log('\nafter:')
  const mixed = mixItems(items)
  printItems(mixed)

  // console.log('\n\nnew index tests')
  // const test = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]
  // console.log(getNewIndex(test, 0, 0))
  // console.log(getNewIndex(test, 0, 1))
  // console.log(getNewIndex(test, 0, 2))
  // console.log(getNewIndex(test, 0, 3))
  // console.log(getNewIndex(test, 0, 4))
  // console.log(getNewIndex(test, 0, 5))
  // console.log(getNewIndex(test, 0, 6))
  // console.log(getNewIndex(test, 0, 7))
  // console.log(getNewIndex(test, 0, 8))
  // console.log('\n\n')

  const startItem = mixed.find(item => item.value === 0)
  if (!startItem) throw new Error('Start item not found!')
  const relevantNumbers = getRelevantNumbers(mixed, startItem)
  console.log(relevantNumbers)

  const answer1 = getCoordinates(relevantNumbers)

  return { answer1 }
}

function mixItems(items: Sequence): Sequence {
  const result: Sequence = [...items]
  items.forEach(item => {
    const i = result.indexOf(item)
    const iNew = getNewIndex(result, i, item.value)

    result.splice(i, 1)
    result.splice(iNew, 0, item)

    console.log(`---\nMove ${item.value} (from ${i} to ${iNew})`)
    // printItems(result)
  })
  return result
}

function getNewIndex(
  items: Sequence,
  from: number,
  moveBy: number,
  // if not static, there is effectively 1 item less in the sequence
  fromIsStatic = false
): number {
  // console.log('--')
  const le = fromIsStatic ? items.length : items.length - 1
  const modulo = moveBy % le
  let moveTo = from + modulo

  // console.log(`${moveBy} % ${items.length - 1} = ${modulo}`)

  if (moveBy === 0) moveTo = from
  // if on right boundary while moving forward, wrap
  else if (moveTo < 0) {
    moveTo = items.length - 1 + moveTo
  }
  else if (moveTo > items.length) {
    moveTo = moveTo - items.length + (fromIsStatic ? 0 : 1)
  }
  return moveTo
}

function getCoordinates(relevantNumbers: number[]): number {
  return relevantNumbers.reduce((result, number) => result + number, 0)
}

function getRelevantNumbers(mixedItems: Sequence, startItem: Item): number[] {
  const iStart = mixedItems.indexOf(startItem)
  return [1000, 2000, 3000]
    .map(number => getNewIndex(mixedItems, iStart, number, true))
    .map(i => mixedItems[i].value)
}

function printItems(items: Sequence): void {
  console.log(items.map(item => item.value).join(', '))
}

function parseItems(input: string): Sequence {
  // Use object references to make it easier to find the same number later
  return input.split('\n').map(line => ({ value: Number(line) }))
}
