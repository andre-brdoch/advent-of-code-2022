interface Solution7 {
  answer1: number
}
type LineType = 'command' | 'dir' | 'file'
type Command = 'cd' | 'ls'
interface LineInfo {
  type: LineType
  line: string
}
interface DirLineInfo extends LineInfo {
  name: string
}
interface FileLineInfo extends LineInfo {
  name: string
  size: number
}
interface CommandLineInfo extends LineInfo {
  command: Command
}
interface CdCommandLineInfo extends CommandLineInfo {
  targetDir: string
}

export default async function solution(inputsFile: string): Promise<Solution7> {
  const lineInfos = parseFile(inputsFile)
  console.log(lineInfos)

  const answer1 = 0
  return { answer1 }
}

function parseFile(file: string): LineInfo[] {
  return file.split('\n').map(line => {
    if (line.startsWith('$ ')) {
      const command = line.split('$ ')[1]
      const parts = command.split(' ')
      const lineInfo: CommandLineInfo = {
        line,
        type: 'command',
        command: parts[0] as Command,
      }
      if (parts[0] === 'cd') {
        const result: CdCommandLineInfo = {
          ...lineInfo,
          targetDir: parts[1],
        }
        // ls
        return result
      }
      return lineInfo
    }
    else if (line.startsWith('dir ')) {
      const lineInfo: DirLineInfo = {
        line,
        type: 'dir',
        name: line.split('dir ')[1],
      }
      return lineInfo
    }
    else {
      const parts = line.split(' ')
      const lineInfo: FileLineInfo = {
        line,
        type: 'file',
        name: parts[1],
        size: Number(parts[0]),
      }
      return lineInfo
    }
  })
}
