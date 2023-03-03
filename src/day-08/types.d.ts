export interface Solution8 {
  answer1: number
  answer2: number
}
export interface Tree {
  size: number
  hidden?: boolean
  topViewDistance?: number
  leftViewDistance?: number
  rightViewDistance?: number
  bottomViewDistance?: number
  scenicScore?: number
}
export type AnalyzedTree = Required<Tree>
