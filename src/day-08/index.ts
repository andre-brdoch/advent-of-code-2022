import { Solution8, Tree, AnalyzedTree } from './types'

export default async function solution(input: string): Promise<Solution8> {
  const rows = parseFile(input)
  const columns = getColumnsFromRows(rows)
  addStatsToTrees(rows, columns)

  const answer1 = getVisibleTreeCount(rows)
  const answer2 = getMostScenicTree(rows as AnalyzedTree[][]).scenicScore

  return { answer1, answer2 }
}

function getMostScenicTree(rows: AnalyzedTree[][]): AnalyzedTree {
  const sorted = rows.flat().sort((a, b) => b.scenicScore - a.scenicScore)
  if (sorted.length === 0) {
    throw new Error('Where are the trees?')
  }
  return sorted[0]
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

      tree.leftViewDistance = getViewDistance(row, j, 'before')
      tree.rightViewDistance = getViewDistance(row, j, 'after')
    })
  )
  columns.forEach(column =>
    column.forEach((tree, j) => {
      if (isLargerThanNeighbors(column, j)) {
        tree.hidden = false
      }

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
    const blockingNeighbor = neighbors.find(
      neighbor => neighbor.size >= tree.size
    )
    const startIndex = blockingNeighbor ? list.indexOf(blockingNeighbor) : 0
    visibleNeighbors = list.slice(startIndex, index)
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
