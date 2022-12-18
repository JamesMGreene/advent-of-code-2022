#!/usr/bin/env -S deno run --allow-read

import { getInputText } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'
import { _ } from '../helpers/lodash.ts'

// Constants
const TUNNEL_WIDTH = 7
enum JetDirection {
  Left = '<',
  Right = '>'
}
enum SpaceType {
  Empty = '⬜️', //'.',
  Rock = '🟫', //'#',
  FallingRock = '🔽', // '@'
}
const ROCK_COUNT = 2022
const ROCK_HORIZONTAL = [
  [SpaceType.FallingRock, SpaceType.FallingRock, SpaceType.FallingRock, SpaceType.FallingRock]
]
const ROCK_CROSS = [
  [SpaceType.Empty, SpaceType.FallingRock, SpaceType.Empty],
  [SpaceType.FallingRock,  SpaceType.FallingRock, SpaceType.FallingRock],
  [SpaceType.Empty, SpaceType.FallingRock, SpaceType.Empty]
]
const ROCK_ELBOW = [
  [SpaceType.Empty, SpaceType.Empty, SpaceType.FallingRock],
  [SpaceType.Empty, SpaceType.Empty, SpaceType.FallingRock],
  [SpaceType.FallingRock,  SpaceType.FallingRock,  SpaceType.FallingRock]
]
const ROCK_VERTICAL = [
  [SpaceType.FallingRock],
  [SpaceType.FallingRock],
  [SpaceType.FallingRock],
  [SpaceType.FallingRock]
]
const ROCK_BLOCK = [
  [SpaceType.FallingRock, SpaceType.FallingRock],
  [SpaceType.FallingRock, SpaceType.FallingRock]
]

// Map to indexes of the ROCK_SHAPES array
enum RockShape {
  Horizontal = 0,
  Cross = 1,
  Elbow = 2,
  Vertical = 3,
  Block = 4
}
const ROCK_SHAPES = [ROCK_HORIZONTAL, ROCK_CROSS, ROCK_ELBOW, ROCK_VERTICAL, ROCK_BLOCK]
const ROCK_SHAPES_COUNT = ROCK_SHAPES.length

const EMPTY_ROW = Array(TUNNEL_WIDTH).fill(SpaceType.Empty)

//
// Processing functions
//

function displayGrid(grid:SpaceType[][]) {
  return grid.map(row => row.join('')).join('\n')
}

function findFallingRockLeftEdge(row:SpaceType[], shape:RockShape) {
  const rowString = row.join('')
  const rockShapeString = ROCK_SHAPES[shape][0].join('')
  return rowString.indexOf(rockShapeString)
}

function shiftFallingRockOnce(grid:SpaceType[][], direction:JetDirection, rockTopDepth:number, shape:RockShape) {
  const rockShape = ROCK_SHAPES[shape]
  const rockHeight = rockShape.length
  const rockWidth = rockShape[0].length

  // Handle jets
  const leftIndex = findFallingRockLeftEdge(grid[rockTopDepth], shape)
  let isBlocked = (
    (direction === JetDirection.Left && leftIndex === 0) ||
    (direction === JetDirection.Right && leftIndex + rockWidth === TUNNEL_WIDTH)
  )

  // Check for left/right mobility
  if (!isBlocked) {
    for (let depth = rockTopDepth; depth < rockTopDepth + rockHeight; depth++) {
      const row = grid[depth]

      // Blocked to the left?
      if (direction === JetDirection.Left && row[leftIndex - 1] !== SpaceType.Empty) {
        isBlocked = true
        break
      }
      // Blocked to the right?
      else if (direction === JetDirection.Right && row[leftIndex + rockWidth] !== SpaceType.Empty) {
        isBlocked = true
        break
      }
      // Otherwise keep checking...
    }
  }

  // Shift left/right if possible
  if (!isBlocked) {
    for (let depth = rockTopDepth; depth < rockTopDepth + rockHeight; depth++) {
      const row = grid[depth]

      // Shift left
      if (direction === JetDirection.Left) {
        // Insert 1 empty space at the right edge
        row.splice(leftIndex + rockWidth, 0, SpaceType.Empty)
        // Remove 1 empty space from the left of the left edge
        row.splice(leftIndex - 1, 1)
      }
      // Shift right
      else {
        // Remove 1 empty space at the right edge
        row.splice(leftIndex + rockWidth, 1)
        // Insert 1 empty space to the left of the left edge
        row.splice(leftIndex, 0, SpaceType.Empty)
      }
    }
  }


  // Handle gravity
  let hasStopped = false

  // Check downward mobility
  const rockBottomDepth = rockTopDepth + rockHeight - 1
  // Bottom-up iteration
  for (let depth = rockBottomDepth; depth >= rockTopDepth; depth--) {
    const nextRow = grid[depth + 1]
    if (!nextRow) {
      // We've literally hit rock bottom, a.k.a. the floor
      hasStopped = true
      break
    }

    const fallingRockRow = grid[depth]
    for (let i = 0; i < TUNNEL_WIDTH; i++) {
      if (fallingRockRow[i] === SpaceType.FallingRock) {
        // If there's a rock below, stop
        if (nextRow[i] === SpaceType.Rock) {
          hasStopped = true
          break
        }
      }
    }
  }

  // If stopped, convert falling rocks to rocks
  if (hasStopped) {
    for (let depth = rockTopDepth; depth < rockTopDepth + rockHeight; depth++) {
      const row = grid[depth]
      for (let i = 0; i < TUNNEL_WIDTH; i++) {
        if (row[i] === SpaceType.FallingRock) {
          row[i] = SpaceType.Rock
        }
      }
    }
  }
  // Else, if not stopped, fall down 1 row
  else {
    // Bottom-up iteration
    for (let depth = rockBottomDepth; depth >= rockTopDepth; depth--) {
      const nextRow = grid[depth + 1]
      const fallingRockRow = grid[depth]
      for (let i = 0; i < TUNNEL_WIDTH; i++) {
        if (fallingRockRow[i] === SpaceType.FallingRock) {
          nextRow[i] = SpaceType.FallingRock
          fallingRockRow[i] = SpaceType.Empty
        }
      }
    }
  }

  return hasStopped
}

//
// Main
//

// Just read it all at once
const rawJetPatterns = await getInputText(getInputFileName())
const jetPatterns = rawJetPatterns.split('')
const JET_PATTERN_COUNT = jetPatterns.length
let jetSteps = 0

const towerGrid:SpaceType[][] = []
// let towerHeight = 0
// let towerGridOffset = 0 // If we get to ignore rows below a certain cutoff because the entire row filled up? 🤞🏻

for (let rockIndex = 0; rockIndex < ROCK_COUNT; rockIndex++) {
  const rockShapeIndex:RockShape = rockIndex % ROCK_SHAPES_COUNT
  const rockShape = ROCK_SHAPES[rockShapeIndex]
  const rockHeight = rockShape.length
  const rockWidth = rockShape[0].length
  let rockTopDepth = 0

  // Add the air gap
  towerGrid.unshift(EMPTY_ROW.slice(0))
  towerGrid.unshift(EMPTY_ROW.slice(0))
  towerGrid.unshift(EMPTY_ROW.slice(0))

  // Go from the bottom up to avoid needing an extra looping cycle
  for (let rowIndex = rockHeight - 1; rowIndex >= 0; rowIndex--) {
    const rockRow = rockShape[rowIndex].slice(0)
    const extraRow = EMPTY_ROW.slice(0)
    extraRow.splice(2, rockWidth, ...rockRow)
    // Add it to the top
    towerGrid.unshift(extraRow)
  }

  console.debug(displayGrid(towerGrid) + '\n')

  // Add the rock to the tower
  let hasStopped = false
  while (!hasStopped) {
    const jetPatternIndex = jetSteps % JET_PATTERN_COUNT
    const jetDirection:JetDirection = jetPatterns[jetPatternIndex] as JetDirection

    console.debug('Jet direction: ' + jetDirection)
    hasStopped = shiftFallingRockOnce(towerGrid, jetDirection, rockTopDepth, rockShapeIndex)
    rockTopDepth++
    jetSteps++

    console.debug(displayGrid(towerGrid) + '\n')
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Remove the dedicated gap added for the rock
  towerGrid.splice(0, rockHeight)
  // Remove all empty rows from the top
  towerGrid.splice(0, towerGrid.findIndex(row => row.some(space => space !== SpaceType.Empty)))

  console.debug(displayGrid(towerGrid) + '\n')
  await new Promise(resolve => setTimeout(resolve, 5000))
}

const towerHeight = towerGrid.length

console.log('[pt1] Height after 2022 settled rocks: ' + towerHeight)
console.log('[pt2] ???: ' + 0)
