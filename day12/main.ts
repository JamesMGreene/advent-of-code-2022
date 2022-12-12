#!/usr/bin/env -S deno run --allow-read

import { getInputRowStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'
import { _ } from '../helpers/lodash.ts'
import dijkstra from 'https://deno.land/x/dijkstra/mod.ts'

//
// Processing functions
//

class Coordinate {
  row: number
  col: number

  constructor(row:number = 0, col:number = 0) {
    this.row = row
    this.col = col
  }

  get height() {
    return heightMap[this.row][this.col]
  }

  toString() {
    return `${this.row},${this.col}`
  }
}

function generateGraphFromHeightMap(heightMap:number[][]) {
  const graph:{ [key: string]: { [key:string]: number } } = {}
  for (let rowIndex = 0; rowIndex < heightMap.length; rowIndex++) {
    for (let colIndex = 0; colIndex < heightMap[rowIndex].length; colIndex++) {
      const current = new Coordinate(rowIndex, colIndex)
      graph[current.toString()] = {}
      if (rowIndex > 0) {
        const up = new Coordinate(rowIndex - 1, colIndex)
        if (up.height - current.height <= 1) {
          graph[current.toString()][up.toString()] = 1
        }
      }
      if (rowIndex < heightMap.length - 1) {
        const down = new Coordinate(rowIndex + 1, colIndex)
        if (down.height - current.height <= 1) {
          graph[current.toString()][down.toString()] = 1
        }
      }
      if (colIndex > 0) {
        const left = new Coordinate(rowIndex, colIndex - 1)
        if (left.height - current.height <= 1) {
          graph[current.toString()][left.toString()] = 1
        }
      }
      if (colIndex < heightMap[rowIndex].length - 1) {
        const right = new Coordinate(rowIndex, colIndex + 1)
        if (right.height - current.height <= 1) {
          graph[current.toString()][right.toString()] = 1
        }
      }
    }
  }
  return graph
}

// Assess the surrounding area
const heightMap:number[][] = []

const rowCharReader = await getInputRowStream(getInputFileName(), { delimiter: '' })

let rowIndex = 0
const startPoints:Coordinate[] = []
let startPoint:Coordinate|null = null
let endPoint:Coordinate|null = null

for await (const heightChars of rowCharReader) {
  heightMap[rowIndex] = heightChars.map((char, colIndex) => {
    let height = char.charCodeAt(0) - 96 // 'a' == 1, 'z' == 26
    if (char === 'S') {
      height = 1
      startPoint = new Coordinate(rowIndex, colIndex)
    }
    else if (char === 'E') {
      height = 26
      endPoint = new Coordinate(rowIndex, colIndex)
    }

    if (char === 'S' || char === 'a') {
      startPoints.push(new Coordinate(rowIndex, colIndex))
    }

    return height
  })
  rowIndex++
}

//console.debug('[\n' + heightMap.map(row => '  ' + JSON.stringify(row)).join(',\n') + '\n]')
//console.debug({ startPoint, endPoint })

const graph = generateGraphFromHeightMap(heightMap)
//console.debug(graph)

const bestPathPt1 = dijkstra.find_path(graph, startPoint!.toString(), endPoint!.toString()); // ["0,0", "0,1", "1,1", ...]
// bestPathPt1[0] === startPoint.toString()
const bestStepCountPt1 = bestPathPt1.length - 1

const bestPathsPt2 = []
for (const startPoint of startPoints) {
  try {
    const path = dijkstra.find_path(graph, startPoint.toString(), endPoint!.toString())
    bestPathsPt2.push(path)
  } catch (error) {
    // If a path could not be found, just ignore it
  }
}

const bestPathPt2 = _.minBy(bestPathsPt2, (path:string[]) => path.length)
// bestPathPt2[0] === startPoints[n].toString()
const bestStepCountPt2 = bestPathPt2.length - 1

console.log('[pt1] Minimum step count: ' + bestStepCountPt1)
console.log('[pt2] Minimum step count: ' + bestStepCountPt2)
