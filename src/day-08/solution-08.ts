interface Solution8 {
  answer1: number
}
interface Tree {
  size: number
  hidden?: boolean
  topViewDistance?: number
  leftViewDistance?: number
  rightViewDistance?: number
  bottomViewDistance?: number
  scenicScore?: number
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

  addStatsToTrees(rows, columns)

  console.log('WITH VISIBILITY:')
  console.log('--- ROWS:')
  const test = rows[1][2]
  console.log(test)
  console.log(`
  top: ${test.topViewDistance} (1)
  left: ${test.leftViewDistance} (1)
  right: ${test.rightViewDistance} (2)
  bottom: ${test.bottomViewDistance} (2)
  `)

  // console.log('--- COLUMNS:')
  // console.log(columns)

  const answer1 = getVisibleTreeCount(rows)

  return { answer1 }
}

function getVisibleTreeCount(rows: Tree[][]): number {
  return rows.reduce(
    (total, row) => total + row.filter(tree => !tree.hidden).length,
    0
  )
}

function addStatsToTrees(rows: Tree[][], columns: Tree[][]): void {
  rows.forEach(row =>
    row.forEach((tree, j) => {
      if (isLargerThanNeighbors(row, j)) {
        tree.hidden = false
      }
      else tree.hidden = true

      // tree.leftViewDistance = getViewDistance(row, j, 'after')
      // tree.rightViewDistance = getViewDistance(row, j, 'before')
      tree.leftViewDistance = getViewDistance(row, j, 'before')
      tree.rightViewDistance = getViewDistance(row, j, 'after')
    })
  )
  columns.forEach(column =>
    column.forEach((tree, j) => {
      if (isLargerThanNeighbors(column, j)) {
        tree.hidden = false
      }

      // tree.topViewDistance = getViewDistance(column, j, 'after')
      // tree.bottomViewDistance = getViewDistance(column, j, 'before')
      tree.topViewDistance = getViewDistance(column, j, 'before')
      tree.bottomViewDistance = getViewDistance(column, j, 'after')

      tree.scenicScore = getScenicScore(tree)
    })
  )
}

function getScenicScore(tree: Tree): number {
  if (
    tree.topViewDistance === undefined ||
    tree.leftViewDistance === undefined ||
    tree.rightViewDistance === undefined ||
    tree.bottomViewDistance === undefined
  ) {
    throw new Error('Need view distances to calculate scenic score')
  }
  return (
    tree.topViewDistance *
    tree.leftViewDistance *
    tree.rightViewDistance *
    tree.bottomViewDistance
  )
}

function getViewDistance(
  list: Tree[],
  index: number,
  direction: 'before' | 'after'
): number {
  const tree = list[index]
  let visibleNeighbors: Tree[]

  if (direction === 'before') {
    const neighbors = list.slice(0, index).reverse()
    const foundIndex = neighbors.findIndex(
      neighbor => neighbor.size >= tree.size
    )
    const blockIndex = foundIndex !== -1 ? foundIndex : undefined
    const blockingNeighbor =
      blockIndex !== undefined ? neighbors[blockIndex] : undefined
    const from = blockingNeighbor ? list.indexOf(blockingNeighbor) : 0
    visibleNeighbors = list.slice(from, index)
  }

  // after
  else {
    const neighbors = index < list.length ? list.slice(index + 1) : []
    const foundIndex = neighbors.findIndex(
      neighbor => neighbor.size >= tree.size
    )
    const blockIndex = foundIndex !== -1 ? foundIndex + 1 : undefined
    visibleNeighbors = neighbors.slice(0, blockIndex)
  }
  return visibleNeighbors.length
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
