interface Solution2 {
  answer1: 0
}
type Option = 'Rock' | 'Paper' | 'Scissors'
type HandA = 'A' | 'B' | 'C'
type HandB = 'X' | 'Y' | 'Z'
interface TranslationMap {
  [key: string]: Option
}

const translationMap: TranslationMap = {
  A: 'Rock',
  X: 'Rock',
  B: 'Paper',
  Y: 'Paper',
  C: 'Scissors',
  Z: 'Scissors',
}

export default async function (input: string): Promise<Solution2> {
  console.log(input)

  return { answer1: 0 }
}

function play(handA: HandA, handB: HandB): any {
  const optionA = translationMap[handA]
  const optionB = translationMap[handB]
}
