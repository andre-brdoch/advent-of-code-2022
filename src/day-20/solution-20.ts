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
  printItems(items)

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
    // console.log(`---\nMove ${item.value}`)

    const i = result.indexOf(item)
    const iNew = getNewIndex(result, i + item.value)
    result.splice(i, 1)
    result.splice(iNew, 0, item)

    // console.log(`old: ${i}, new: ${iNew}`)
    // printItems(result)
  })
  return result
}

function getNewIndex(items: Sequence, moveTo: number): number {
  let result = moveTo
  if (moveTo <= 0) {
    result = items.length - 1 + result
  }
  else if (result >= items.length) {
    result = result - items.length + 1
  }
  return result
}

function getCoordinates(relevantNumbers: number[]): number {
  return relevantNumbers.reduce((result, number) => result + number, 0)
}

function getRelevantNumbers(mixedItems: Sequence, startItem: Item): number[] {
  const iStart = mixedItems.indexOf(startItem)
  return [1000, 2000, 3000]
    .map(
      number =>
        // use module to avoid actually wrapping thousands of times
        getNewIndex(mixedItems, iStart + (number % mixedItems.length)) - 1
    )
    .map(i => mixedItems[i].value)
}

function printItems(items: Sequence): void {
  console.log(items.map(item => item.value).join(', '))
}

function parseItems(input: string): Sequence {
  // Use object references to make it easier to find the same number later
  return input.split('\n').map(line => ({ value: Number(line) }))
}
