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
  console.log(mixed)

  return { answer1: 0 }
}

function mixItems(items: Sequence): Sequence {
  const result: Sequence = [...items]
  items.forEach(item => {
    console.log(`---\nMove ${item.value}`)

    const i = result.indexOf(item)
    let iNew = i + item.value
    if (iNew <= 0) {
      iNew = items.length - 1 + iNew
    }
    else if (iNew >= result.length) {
      iNew = iNew - result.length + 1
    }

    result.splice(i, 1)
    result.splice(iNew, 0, item)

    console.log(`old: ${i}, new: ${iNew}`)
    printItems(result)
  })
  return result
}

function printItems(items: Sequence): void {
  console.log(items.map(item => item.value).join(', '))
}

function parseItems(input: string): Sequence {
  // Use object references to make it easier to find the same number later
  return input.split('\n').map(line => ({ value: Number(line) }))
}
