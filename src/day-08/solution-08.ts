interface Solution8 {
  answer1: number
}
interface Tree {
  size: number
  hidden?: boolean
}

export default async function solution(input: string): Promise<Solution8> {
  console.log('---')
  console.log(input)
  console.log('---')

  const rows = parseFile(input)
  // console.log('--- ROWS:')
  // console.log(rows)
  const columns = getColumnsFromRows(rows)
  // console.log('--- COLUMNS:')
  // console.log(columns)

  addVisibility(rows, columns)

  // console.log('WITH VISIBILITY:')
  // console.log('--- ROWS:')
  // console.log(rows)
  // console.log('--- COLUMNS:')
  // console.log(columns)

  const answer1 = getVisibleCount(rows)

  return { answer1 }
}

function getVisibleCount(rows: Tree[][]): number {
  return rows.reduce(
    (total, row) => total + row.filter(tree => !tree.hidden).length,
    0
  )
}

function addVisibility(rows: Tree[][], columns: Tree[][]): void {
  rows.forEach(row =>
    row.forEach((tree, j) => {
      if (isLargerThanNeighbors(row, j)) {
        tree.hidden = false
      }
      else tree.hidden = true
    })
  )
  columns.forEach(column =>
    column.forEach((tree, i) => {
      if (isLargerThanNeighbors(column, i)) {
        tree.hidden = false
      }
    })
  )
}

function isLargerThanNeighbors(list: Tree[], index: number): boolean {
  const tree = list[index]
  const prev = list.slice(0, index)
  const next = index < list.length ? list.slice(index + 1) : []
  const isLargerThanPrev = prev.every(neighbor => tree.size > neighbor.size)
  const isLargerThanNext = next.every(neighbor => tree.size > neighbor.size)
  return isLargerThanPrev || isLargerThanNext
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
        tree.hidden = false
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
          tree.hidden = false
        }
        return tree
      })
  )
}
