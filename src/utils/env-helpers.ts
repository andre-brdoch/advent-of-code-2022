interface Flags {
  isTest?: boolean
  // test file name
  file?: string
  // input passed directly via CLI
  cliInput?: string
  visualize?: boolean
  noLog?: boolean
}
interface Args extends Flags {
  day: number
}

export function parseArgs(): Args {
  const args = process.argv
  const flagMap: Flags = args
    .map(str => str.match(/^--(\w+)=(.+)$/))
    .filter(match => match !== null)
    .reduce((result, match) => {
      const [, name, value] = match as RegExpMatchArray
      const convertedValue =
        value === 'true' ? true : value === 'false' ? false : value
      return {
        ...result,
        [name]: convertedValue,
      }
    }, {})
  const result = {
    day: Number(args[2]),
    ...flagMap,
  }
  if (flagMap.file?.includes('test')) {
    result.isTest = true
  }
  return result
}

export function isTest(): boolean {
  const [, , , mode] = process.argv
  return mode === 'test'
}
