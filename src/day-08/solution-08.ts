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

  const rows = parseFile(input)
  console.log('--- ROWS:')
  console.log(rows)
  const columns = getColumnsFromRows(rows)
  console.log('--- COLUMNS:')
  console.log(columns)

  return { answer1: 0 }
}

// for ease of use, also create a column view, referencing the same trees
function getColumnsFromRows(rows: Tree[][]): Tree[][] {
  // create empty array grid
  const columns: Tree[][] = Array.from(Array(rows[0].length)).map(() => [])
  rows.forEach(trees => {
    trees.forEach((tree, j) => {
      const column = columns[j]
      // if first or last column
      if (j === 0 || j === columns.length - 1) {
        tree.edge = true
      }
      column.push(tree)
    })
  })
  return columns
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
