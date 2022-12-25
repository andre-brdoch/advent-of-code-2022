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

  console.log('---')

  console.log(toSnafu(24))

  return { answer1: 0 }
}

function toSnafu(number: number): Snafu {
  let counter = 0
  const highestBase = 1
  let didFindHighest = false
  const bases = []

  while (!didFindHighest) {
    const base = Math.pow(5, counter)
    console.log(base)
    if (base <= number) {
      // highestBase = base
      bases.push(base)
      counter += 1
    }
    else didFindHighest = true
  }
  console.log(bases)
  console.log(`highest base fitting into ${number}: ${bases[counter - 1]}`)

  bases.reverse()
  let result = ''
  let rest = number
  for (let i = 0; i < counter; i++) {
    console.log(rest)
    const base = bases[i]
    const fits = Math.floor(rest / base)
    console.log('fits', fits, 'x')
    rest -= fits * base
    result += fits
  }

  console.log(`${number} is in snafu ${result}`)

  return result
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
