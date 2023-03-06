export interface MonkeyParsed {
  name: string
  items: number[]
  divisableBy: number
  activity: number
  inspect: (item: number) => number
  targetAName?: string
  targetBName?: string
  targetA?: Monkey | MonkeyParsed
  targetB?: Monkey | MonkeyParsed
}
export interface Monkey extends MonkeyParsed {
  targetA: Monkey
  targetB: Monkey
}
export type ManageFrustrationFn = (item: number) => number
