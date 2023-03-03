import {
  Solution7,
  Command,
  Line,
  LineDir,
  LineFile,
  LineCommand,
  LineCdCommand,
  Data,
  Dir,
  AnalyzedDir,
  AnalyzedData,
} from './types'

const DISK_SIZE = 70000000
const UPDATE_SIZE = 30000000

export default async function solution(inputsFile: string): Promise<Solution7> {
  const lines = parseFile(inputsFile)
  const tree = buildTree(lines)
  addSizesToDirectories(tree)
  const dirList = getDirList(tree as AnalyzedDir)
  const largeDirs = getSmallDirs(dirList, 100000)
  const answer1 = getTotalSize(largeDirs)
  const dirToDelete = getDirToDeleteForUpdate(dirList)
  const answer2 = dirToDelete.size

  return { answer1, answer2 }
}

function buildTree(lines: Line[]): Dir {
  const tree: Dir = { name: '/', children: [] }
  let currentDirectory: Dir = tree

  if (
    !lines.length ||
    !lineIsCdCommand(lines[0]) ||
    lines[0].targetDir !== '/'
  ) {
    throw new Error('Must start with command "cd /"')
  }

  lines.forEach((line, i) => {
    const remainingLines = lines.slice(i + 1)

    if (lineIsCdCommand(line)) {
      if (line.targetDir === '/') {
        console.log('Starting from root')
      }
      else if (line.targetDir === '..') {
        if (currentDirectory.parent === undefined) {
          throw new Error('Can not execute command"cd .." - Already in root')
        }
        currentDirectory = currentDirectory.parent
      }
      else {
        // move to next dir
        const targetChild = currentDirectory.children.find(
          child => child.name === line.targetDir
        ) as Dir
        if (targetChild === undefined) {
          throw new Error(
            `Can not execute "${line.command}" - directory "${line.targetDir}" does not exist.`
          )
        }
        currentDirectory = targetChild
      }
    }
    else if (lineIsCommand(line)) {
      // ls
      const nextCommandIndex = remainingLines.findIndex(line =>
        lineIsCommand(line)
      )
      const firstChildIndex = remainingLines.length > 1 ? 0 : undefined
      const lastChildIndex =
        nextCommandIndex >= 0 ? nextCommandIndex : undefined
      const childLines = remainingLines.slice(firstChildIndex, lastChildIndex)
      const children: Data[] = childLines
        .map(line => lineToData(line, currentDirectory))
        .filter(data => data !== undefined) as Data[]

      currentDirectory.children = children
    }
  })
  return tree
}

function addSizesToDirectories(dir: Dir): void {
  dir.size = 0
  dir.children.forEach(child => {
    if (dataIsDir(child)) {
      addSizesToDirectories(child)
    }
    ;(dir as AnalyzedDir).size += (child as AnalyzedData).size
  })
}

function getDirList(dir: AnalyzedDir): AnalyzedDir[] {
  return dir.children.reduce(
    (result, child) => {
      if (dataIsDir(child)) {
        return [...result, child, ...getDirList(child)]
      }
      // file
      else return result
    },
    // use dir as default if root
    dir.name === '/' ? [dir] : ([] as AnalyzedDir[])
  )
}

function getSmallDirs(dirList: AnalyzedDir[], maxSize: number): AnalyzedDir[] {
  return dirList.filter(dir => dir.size <= maxSize)
}

function getTotalSize(dataList: AnalyzedData[]): number {
  return dataList.reduce((result, data) => result + data.size, 0)
}

function getDirToDeleteForUpdate(dirList: AnalyzedDir[]): AnalyzedDir {
  const availableSpace = DISK_SIZE - dirList[0].size
  const spaceToFree = UPDATE_SIZE - availableSpace
  const dir = dirList
    // sort from small to large
    .sort((a, b) => a.size - b.size)
    .find(dir => dir.size >= spaceToFree)
  if (dir === undefined) {
    throw new Error('Your computer is full and there is nothing you can do!')
  }
  return dir
}

function lineToData(line: Line, previousDir: Dir): Data | undefined {
  if (lineIsFile(line)) {
    return {
      name: line.name,
      size: line.size,
      parent: previousDir,
    }
  }
  else if (lineIsDir(line)) {
    return {
      name: line.name,
      children: [],
      parent: previousDir,
    }
  }
  return undefined
}

function parseFile(file: string): Line[] {
  return file.split('\n').map(line => {
    if (line.startsWith('$ ')) {
      const command = line.split('$ ')[1]
      const parts = command.split(' ')
      const lineInfo: LineCommand = {
        line,
        type: 'command',
        command: parts[0] as Command,
      }
      if (parts[0] === 'cd') {
        const result: LineCdCommand = {
          ...lineInfo,
          targetDir: parts[1],
        }
        // ls
        return result
      }
      return lineInfo
    }
    else if (line.startsWith('dir ')) {
      const lineInfo: LineDir = {
        line,
        type: 'dir',
        name: line.split('dir ')[1],
      }
      return lineInfo
    }
    else {
      const parts = line.split(' ')
      const lineInfo: LineFile = {
        line,
        type: 'file',
        name: parts[1],
        size: Number(parts[0]),
      }
      return lineInfo
    }
  })
}

// === Typescript helpers ===

function lineIsFile(line: Line): line is LineFile {
  return line.type === 'file'
}

function lineIsDir(line: Line): line is LineDir {
  return line.type === 'dir'
}

function lineIsCommand(line: Line): line is LineCommand {
  return line.type === 'command'
}

function lineIsCdCommand(line: Line): line is LineCdCommand {
  return lineIsCommand(line) && line.command === 'cd'
}

function dataIsDir(data: Data): data is Dir {
  return Array.isArray((data as Dir).children)
}
