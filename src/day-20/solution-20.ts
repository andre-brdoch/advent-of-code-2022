import { Logger } from '../utils/Logger.js'
import { parseArgs } from '../utils/env-helpers.js'

interface Solution20 {
  answer1: number
  answer2: number
}
interface Item {
  value: number
}
type Sequence = Item[]

const DECRYPTION_KEY = 811589153

const logger = new Logger()

export default async function solution(input: string): Promise<Solution20> {
  console.log('before:')
  const items = parseItems(input)
  printItems(items)

  const answer1 = getAnswer1(items)
  const answer2 = getAnswer2(items)

  return {
    answer1,
    answer2,
    ...logger.getVisual(
      parseArgs().file?.replace('input', 'output') ?? 'output.txt'
    ),
  }
}

function getAnswer1(items: Sequence): number {
  const mixed = mixItems(items)

  logger.log('\nFinal position:')
  printItems(mixed)
  const startItem = mixed.find(item => item.value === 0)
  if (!startItem) throw new Error('Start item not found!')
  const relevantNumbers = getRelevantNumbers(mixed, startItem)
  return getCoordinates(relevantNumbers)
}

function getAnswer2(items: Sequence): number {
  const decrypted = items.map(item => ({ value: item.value * DECRYPTION_KEY }))
  console.log(decrypted)
  const mixed = mixItems(decrypted, 10)
  printItems(mixed)

  const startItem = mixed.find(item => item.value === 0)
  if (!startItem) throw new Error('Start item not found!')
  const relevantNumbers = getRelevantNumbers(mixed, startItem)
  return getCoordinates(relevantNumbers)
}

function getNewIndex(
  items: Sequence,
  from: number,
  moveBy: number,
  // if not static, there is effectively 1 item less in the sequence
  fromIsStatic = false
): number {
  const le = fromIsStatic ? items.length : items.length - 1
  const modulo = moveBy % le
  let moveTo = from + modulo

  if (moveBy === 0) moveTo = from
  // if on right boundary while moving forward, wrap
  else if (moveTo === items.length - 1 && moveBy > 0) {
    moveTo = 0
  }
  // if on left boundary while moving backwards, wrap
  else if (moveTo === 0 && moveBy < 0) {
    moveTo = items.length - 1
  }
  else if (moveTo < 0) {
    moveTo = items.length - 1 + moveTo
  }
  else if (moveTo >= items.length) {
    moveTo = moveTo - items.length + (fromIsStatic ? 0 : 1)
  }
  return moveTo
}

function mixItems(items: Sequence, times = 1): Sequence {
  const result: Sequence = [...items]
  Array.from(Array(times)).forEach(() => {
    items.forEach(item => {
      const i = result.indexOf(item)
      const iNew = getNewIndex(result, i, item.value)

      result.splice(i, 1)
      result.splice(iNew, 0, item)

      logger.log(`\n\nMove ${item.value} (from ${i} to ${iNew})`)
      printItems(result)
    })
  })
  return result
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
  logger.log(items.map(item => item.value).join(', '))
}

function parseItems(input: string): Sequence {
  // Use object references to make it easier to find the same number later
  return input.split('\n').map(line => ({ value: Number(line) }))
}
