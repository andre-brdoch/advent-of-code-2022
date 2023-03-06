interface CliFlags {
  // environment folder name
  env: string
  // should print outputs to files
  visualize?: boolean
  // should surpress logs to terminal
  noLog?: boolean
}
interface EnvArgs extends CliFlags {
  day: number
  isTest: boolean
}
interface Output {
  file: string
  data: string
}
export type Solution = Promise<{
  answer1: number | string
  answer2: number | string
  visuals?: (Output | null)[]
}>
export type SolutionFn = (input: string, args: EnvArgs) => Solution
