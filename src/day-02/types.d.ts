export interface Solution2 {
  answer1: number
  answer2: number
}
export type Sign = 'A' | 'B' | 'C' | 'X' | 'Y' | 'Z'
export type Option = 'Rock' | 'Paper' | 'Scissors'
export type Outcome = 'win' | 'draw' | 'loss'
export interface Map<T> {
  [key: string]: T
}
