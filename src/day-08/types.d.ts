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
