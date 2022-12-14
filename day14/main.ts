#!/usr/bin/env -S deno run --allow-read

import { getInputRowStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'

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

  toString() {
    return `${this.row},${this.col}`
  }
}

enum SpaceType {
  // Air = '.',
  // Rock = '#',
  // Sand = 'o',
  // Hole = '+'
  Air = '⬜',
  Rock = '🟫',
  Sand = '🟡',
  Hole = '⏬', //'⬛'
}

function displayCaveMap(caveMap:SpaceType[][]) {
  return caveMap.map((row:SpaceType[]) => row.join('')).join('\n')
}

function findRockLineCoordinates(start:Coordinate, end:Coordinate|undefined) {
  const rockLine = [start]

  // If there's no end, we're done
  if (!end) return rockLine

  const rowDelta = end.row - start.row
  const colDelta = end.col - start.col

  const rowStep = rowDelta === 0 ? 0 : rowDelta / Math.abs(rowDelta)
  const colStep = colDelta === 0 ? 0 : colDelta / Math.abs(colDelta)

  let currentRow = start.row
  let currentCol = start.col
  while (currentRow !== end.row || currentCol !== end.col) {
    currentRow += rowStep
    currentCol += colStep
    rockLine.push(new Coordinate(currentRow, currentCol))
  }

  return rockLine
}

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const rockReader = await getInputRowStream(getInputFileName(), { delimiter: ' -> ' })

const topRow = 0                           // top == 0
let bottomRow = -1                         // bottom == height - 1
let leftmostCol = Number.MAX_SAFE_INTEGER  // left == 0
let rightmostCol = -1                      // right == width - 1
const sandEntrance = new Coordinate(0, 500)

const rockCoordinates = new Map<string, Coordinate>()

// Assess each row of items
for await (const rockShape:string[] of rockReader) {
  const rockPaths = rockShape.map(coordinateString => {
    const [col, row] = coordinateString.split(',').map(Number)
    const coordinate = new Coordinate(row, col)

    // Side effect: update the bounds of our cave
    //if (row < topRow) topRow = row
    if (row > bottomRow) bottomRow = row
    if (col < leftmostCol) leftmostCol = col
    if (col > rightmostCol) rightmostCol = col
  
    return coordinate
  })

  for (let i = 0; i < rockPaths.length - 1; i++) {
    const rockLine = findRockLineCoordinates(rockPaths[i], rockPaths[i + 1])
    for (const rockCoord of rockLine) {
      rockCoordinates.set(rockCoord.toString(), rockCoord)
    }
  }
}

//console.debug(rockCoordinates)

const caveWidthPt1 = rightmostCol - leftmostCol + 3 // 1 open gap to left and right
const caveHeightPt1 = bottomRow - topRow + 2 // 1 open gap to bottom
const rowOffsetPt1 = topRow
const colOffsetPt1 = leftmostCol - 1
// For part 2, use some arbitrarily large numbers of open gaps sufficient enough for the input 🤷
const caveWidthPt2 = rightmostCol - leftmostCol + 453 // 226 open gaps to left and right
const caveHeightPt2 = bottomRow - topRow + 3 // 1 open gap, then one infinite floor to bottom
const rowOffsetPt2 = topRow
const colOffsetPt2 = leftmostCol - 226


// Create the overall map grid
const caveMapPt1:SpaceType[][] = new Array(caveHeightPt1).fill(0).map(() => new Array(caveWidthPt1).fill(SpaceType.Air))
const caveMapPt2:SpaceType[][] = new Array(caveHeightPt2).fill(0).map(() => new Array(caveWidthPt2).fill(SpaceType.Air))

const dropSandPt1 = function(sandEntrance:Coordinate, caveMap:SpaceType[][]):Coordinate|null {
  let currentRow = sandEntrance.row - rowOffsetPt1
  let currentCol = sandEntrance.col - colOffsetPt1
  while (
    currentRow < caveHeightPt1 &&
    currentCol >= 0 && currentCol < caveWidthPt1 &&
    (caveMap[currentRow][currentCol] === SpaceType.Air || caveMap[currentRow][currentCol] === SpaceType.Hole)
  ) {
    const spaceBelow = caveMap[currentRow + 1]?.[currentCol]

    if (!spaceBelow) { return null }
    
    // If there is air below, the sand keeps falling straight down
    if (spaceBelow === SpaceType.Air) {
      currentRow++
      continue
    }
    // If there is sand or rock below, the sand tries to flow around it
    else if (spaceBelow === SpaceType.Sand || spaceBelow === SpaceType.Rock) {
      // First, the sand tries to flow to down and to the left
      const spaceBelowLeft = caveMap[currentRow + 1]?.[currentCol - 1]
      if (spaceBelowLeft && spaceBelowLeft === SpaceType.Air) {
        currentRow++
        currentCol--
        continue
      }
      // If that is blocked, the sand tries to flow down and to the right
      const spaceBelowRight = caveMap[currentRow + 1]?.[currentCol + 1]
      if (spaceBelowRight && spaceBelowRight === SpaceType.Air) {
        currentRow++
        currentCol++
        continue
      }
      // Else... everything is blocked, so stop above
      break
    }
  }

  return new Coordinate(currentRow, currentCol)
}

const dropSandPt2 = function(sandEntrance:Coordinate, caveMap:SpaceType[][]):Coordinate|null {
  let currentRow = sandEntrance.row - rowOffsetPt2
  let currentCol = sandEntrance.col - colOffsetPt2
  while (
    currentRow < caveHeightPt2 &&
    currentCol >= 0 && currentCol < caveWidthPt2 &&
    (caveMap[currentRow][currentCol] === SpaceType.Air || caveMap[currentRow][currentCol] === SpaceType.Hole)
  ) {
    const spaceBelow = caveMap[currentRow + 1]?.[currentCol]

    if (!spaceBelow) { return null }
    
    // If there is air below, the sand keeps falling straight down
    if (spaceBelow === SpaceType.Air) {
      currentRow++
      continue
    }
    // If there is sand or rock below, the sand tries to flow around it
    else if (spaceBelow === SpaceType.Sand || spaceBelow === SpaceType.Rock) {
      // First, the sand tries to flow to down and to the left
      const spaceBelowLeft = caveMap[currentRow + 1]?.[currentCol - 1]
      if (spaceBelowLeft && spaceBelowLeft === SpaceType.Air) {
        currentRow++
        currentCol--
        continue
      }
      // If that is blocked, the sand tries to flow down and to the right
      const spaceBelowRight = caveMap[currentRow + 1]?.[currentCol + 1]
      if (spaceBelowRight && spaceBelowRight === SpaceType.Air) {
        currentRow++
        currentCol++
        continue
      }
      // Else... everything is blocked, so stop above
      break
    }
  }

  return new Coordinate(currentRow, currentCol)
}

//console.debug(displayCaveMap(caveMapPt1) + '\n')
//console.debug(displayCaveMap(caveMapPt2) + '\n')

// Add the sand entrance
const holeRowPt1 = sandEntrance.row - rowOffsetPt1
const holeColPt1 = sandEntrance.col - colOffsetPt1
caveMapPt1[holeRowPt1][holeColPt1] = SpaceType.Hole
//console.debug({ hole: sandEntrance.toString(), holeRowPt1, holeColPt1 })

const holeRowPt2 = sandEntrance.row - rowOffsetPt2
const holeColPt2 = sandEntrance.col - colOffsetPt2
caveMapPt2[holeRowPt2][holeColPt2] = SpaceType.Hole
//console.debug({ hole: sandEntrance.toString(), holeRowPt2, holeColPt2 })

//console.debug(displayCaveMap(caveMapPt1) + '\n')
//console.debug(displayCaveMap(caveMapPt2) + '\n')

// Add the rocks
for (const rockCoord of rockCoordinates.values()) {
  const rockRowPt1 = rockCoord.row - rowOffsetPt1
  const rockColPt1 = rockCoord.col - colOffsetPt1
  caveMapPt1[rockRowPt1][rockColPt1] = SpaceType.Rock

  const rockRowPt2 = rockCoord.row - rowOffsetPt2
  const rockColPt2 = rockCoord.col - colOffsetPt2
  caveMapPt2[rockRowPt2][rockColPt2] = SpaceType.Rock
}

// Add the extra rock floor for part 2
for (let i = 0; i < caveWidthPt2; i++) {
  caveMapPt2[caveHeightPt2 - 1][i] = SpaceType.Rock
}

// console.debug(displayCaveMap(caveMapPt1) + '\n')
// console.debug(displayCaveMap(caveMapPt2) + '\n')

// Add the sand
let previousSandCoordPt1:Coordinate|null = null
let restingGrainsOfSandPt1 = 0
while (true) {
  const sandFinalCoord = dropSandPt1(sandEntrance, caveMapPt1)

  if (!sandFinalCoord) {
    break
  }
  if (previousSandCoordPt1 != null && sandFinalCoord.toString() === previousSandCoordPt1!.toString()) {
    break
  }

  previousSandCoordPt1 = sandFinalCoord
  caveMapPt1[sandFinalCoord.row][sandFinalCoord.col] = SpaceType.Sand
  restingGrainsOfSandPt1++

  //console.debug(displayCaveMap(caveMapPt1) + '\n')
}
// console.debug(displayCaveMap(caveMapPt1) + '\n')

let restingGrainsOfSandPt2 = 0
const finalRestingSandCoord = new Coordinate(sandEntrance.row - rowOffsetPt2, sandEntrance.col - colOffsetPt2)
while (true) {
  const sandFinalCoord = dropSandPt2(sandEntrance, caveMapPt2)

  if (!sandFinalCoord) {
    break
  }

  caveMapPt2[sandFinalCoord.row][sandFinalCoord.col] = SpaceType.Sand
  restingGrainsOfSandPt2++

  // If this last sand grain is blocking the entrance, stop
  if (sandFinalCoord.toString() === finalRestingSandCoord.toString()) {
    break
  }

  // console.debug(displayCaveMap(caveMapPt2) + '\n')

  // Pause
  //await new Promise((resolve) => setTimeout(resolve, 250))
}
//console.debug(displayCaveMap(caveMapPt2) + '\n')

console.log('[pt1] Grains of sand resting before the abyss: ' + restingGrainsOfSandPt1)
console.log('[pt2] Grains of sand resting before plugging the hole: ' + restingGrainsOfSandPt2)
