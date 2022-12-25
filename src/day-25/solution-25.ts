interface Solution25 {
  answer1: string
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
  toSnafu(1)
  toSnafu(2)
  toSnafu(3)
  toSnafu(4)
  toSnafu(5)
  toSnafu(6)
  toSnafu(7)
  toSnafu(8)
  toSnafu(9)
  toSnafu(10)
  toSnafu(15)
  toSnafu(20)
  toSnafu(2022)
  toSnafu(12345)
  toSnafu(314159265)

  const answer1 = toSnafu(decimalSum)

  return { answer1 }
}

function toSnafu(number: number): Snafu {
  let counter = 0
  let didFindHighest = false
  const bases = []

  while (!didFindHighest) {
    const base = Math.pow(5, counter)
    if (base <= number) {
      // highestBase = base
      bases.push(base)
      counter += 1
    }
    else didFindHighest = true
  }

  bases.reverse()
  let result = ''
  let rest = number
  for (let i = 0; i < counter; i++) {
    const base = bases[i]
    const fits = Math.floor(rest / base)
    rest -= fits * base
    result += fits
  }

  console.log('\ndecimal:', number)
  console.log(`unadjusted: ${result}`)

  // prevents highers number than 2 by carrying them over to the left as negatives
  if (!isValidSnafu(result)) {
    const newChars: string[] = []
    let carryOver = 0
    for (let i = result.length - 1; i >= 0 || carryOver; i--) {
      const char = result.charAt(i)
      const digit = Number(char) + carryOver
      // console.log('char:', digit)
      if (isValidSnafu(`${digit}`)) {
        newChars.push(`${digit}`)
        carryOver = 0
        continue
      }
      if (digit === 3) newChars.push('=')
      else if (digit === 4) newChars.push('-')
      else newChars.push(`${digit % 5}`)
      carryOver = 1
    }
    result = newChars.reverse().join('')
  }

  console.log(`snafu: ${result}\n`)

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

function isValidSnafu(snafu: Snafu): boolean {
  return /^[0-2-=]*$/.test(snafu)
}

function parseSnafus(input: string): Snafu[] {
  return input.split('\n')
}
