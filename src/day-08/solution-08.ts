interface Solution8 {
  answer1: number
}
interface Tree {
  size: number
  edge?: boolean
  visible?: boolean
}

export default async function solution(input: string): Promise<Solution8> {
  console.log('---')
  console.log(input)
  console.log('---')

  const parsedRows = parseFile(input)
  console.log(parsedRows)

  return { answer1: 0 }
}

function parseFile(input: string): Tree[][] {
  const rows = input.split('\n')
  return rows.map((line, i) =>
    line
      .split('')
      .map(stringDigit => Number(stringDigit))
      .map(digit => {
        const tree: Tree = {
          size: digit,
        }
        // if first or last row
        if (i === 0 || i === rows.length - 1) {
          tree.edge = true
        }
        return tree
      })
  )
}
