interface Solution12 {
  answer1: number
}

export default async function solution(input: string): Promise<Solution12> {
  console.log(input)
  console.log('---')

  const map = parseMap(input)
  console.log(map)

  return { answer1: 0 }
}

function parseMap(input: string): string[][] {
  return input.split('\n').map(line => line.split(''))
}
