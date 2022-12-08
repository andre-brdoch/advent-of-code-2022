interface Solution7 {
  answer1: number
}
type LineType = 'command' | 'dir' | 'file'
type Command = 'cd' | 'ls'
interface Line {
  type: LineType
  line: string
}
interface LineDir extends Line {
  name: string
}
interface LineFile extends Line {
  name: string
  size: number
}
interface LineCommand extends Line {
  command: Command
}
interface LineCdCommand extends LineCommand {
  targetDir: string
}
type Data = File | Dir
interface File {
  name: string
  size: number
  parent: Dir
}
interface Dir {
  name: string
  children: Data[]
  parent?: Dir
  size?: number
}
interface AnalyzedDir extends Dir {
  size: number
}
type AnalyzedData = File | AnalyzedDir

export default async function solution(inputsFile: string): Promise<Solution7> {
  const lines = parseFile(inputsFile)
  console.log(lines)
  const tree = buildTree(lines)
  addSizesToDirectories(tree)
  console.log(tree)

  const answer1 = 0
  return { answer1 }
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
        // TODO
        console.log('go backwards')
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
        console.log('targetChild')
        console.log(targetChild)
        currentDirectory = targetChild
      }
    }
    else if (lineIsCommand(line)) {
      console.log('--- ls')

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
      console.log('start:', firstChildIndex, 'end:', lastChildIndex)
      console.log('childLines:')
      console.log(childLines)
      console.log('children:')
      console.log(children)

      currentDirectory.children = children
    }
  })

  console.log('==== TREE')
  console.log(tree)
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
