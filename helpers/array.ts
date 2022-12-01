export function sumLines(array:string[]): number {
  return array.reduce((acc:number, current:string) => acc + Number(current), 0)
}

export function sum(array:number[]): number {
  return array.reduce((acc:number, current:number) => acc + current, 0)
}

export function sortAscending(array:number[]): void {
  array.sort((a, b) => a - b)
}

export function sortDescending(array:number[]): void {
  array.sort((a, b) => b - a)
}
