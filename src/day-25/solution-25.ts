interface Solution25 {
  answer1: number
}
type Snafu = string

export default async function solution(input: string): Promise<Solution25> {
  const snafus = parseSnafus(input)
  console.log(snafus)

  return { answer1: 0 }
}

function parseSnafus(input: string): Snafu[] {
  return input.split('\n')
}
