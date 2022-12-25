interface Solution25 {
  answer1: number
}
type Snafu = string

export default async function solution(input: string): Promise<Solution25> {
  const snafus = parseSnafus(input)
  console.log(snafus)
  console.log(toDecimal(snafus[0]))
  const decimals = snafus.map(toDecimal)
  console.log(decimals)
  const decimalSum = decimals.reduce((result, n) => result + n, 0)
  console.log(decimalSum)

  return { answer1: 0 }
}

function toDecimal(snafu: Snafu): number {
  return snafu
    .split('')
    .reverse()
    .reduce((result, char, i) => {
      const base = Math.pow(5, i)
      let n = parseInt(char, 10)
      if (isNaN(n)) {
        if (char === '-') n = -1
        else if (char === '=') n = -2
      }
      return result + base * n
    }, 0)
}

function parseSnafus(input: string): Snafu[] {
  return input.split('\n')
}
