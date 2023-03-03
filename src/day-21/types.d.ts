export interface Solution21 {
  answer1: number
  answer2: number
}
export interface Humanoid {
  name: Name
  number?: number
  formula?: Formula
  cameFrom?: Humanoid
}
export type Name = string
export type Operator = '+' | '-' | '/' | '*'
export interface Formula {
  operator: Operator
  leftOperand: Name
  rightOperand: Name
}
