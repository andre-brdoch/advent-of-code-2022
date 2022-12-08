interface Solution8 {
  answer1: number
}
interface Tree {
  size: number
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

  addVisibility(rows, columns)

  console.log('WITH VISIBILITY:')
  console.log('--- ROWS:')
  console.log(rows)
  console.log('--- COLUMNS:')
  console.log(columns)

  return { answer1: 0 }
}

function addVisibility(rows: Tree[][], columns: Tree[][]): void {
  rows.forEach(row =>
    row.forEach((tree, j) => {
      if (isHiddenByNeighbors(row, j)) {
        tree.visible = true
      }
    })
  )
}

function isHiddenByNeighbors(list: Tree[], index: number): boolean {
  const tree = list[index]
  const neighbors = list.filter(neighbor => neighbor !== tree)
  return neighbors.some(neighbor => neighbor.size >= tree.size)
  // const prev = list.length ? list.slice(0, index - 1) : []
  // const next = index < list.length ? list.slice(index + 1) : []
  // const prevIsLarger = prev.some(tree => tree.size > size)
  // const nextIsLarger = next.some(tree => tree.size > size)
  // return prevIsLarger || nextIsLarger
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
        tree.visible = true
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
          tree.visible = true
        }
        return tree
      })
  )
}
