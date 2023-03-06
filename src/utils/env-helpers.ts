import { CliFlags, EnvArgs } from '../types'

export function parseArgs(): EnvArgs {
  const args = process.argv
  const flagMap: CliFlags = args
    .map(str => str.match(/^--(\w+)=(.+)$/))
    .filter(match => match !== null)
    .reduce(
      (result, match) => {
        const [, name, value] = match as RegExpMatchArray
        const convertedValue =
          value === 'true' ? true : value === 'false' ? false : value
        return {
          ...result,
          [name]: convertedValue,
        }
      },
      {
        env: 'test',
      }
    )
  const result = {
    day: Number(args[2]),
    ...flagMap,
    isTest: flagMap.env?.includes('test'),
  }
  return result
}
