export type ValueOrArray<T> = T | ValueOrArray<T>[]
export type Value = ValueOrArray<number>
export type ValueList = Value[]
export type Packet = Value[]
export type Group = [Packet, Packet]
export type CompareResult = 1 | -1 | 0