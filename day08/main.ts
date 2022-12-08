#!/usr/bin/env -S deno run --allow-read

import { getInputRowStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'
import { _ } from '../helpers/lodash.ts'

//
// Processing functions
//

//???

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const rowCharReader = await getInputRowStream(getInputFileName(), { delimiter: '' })

// Assess each row of trees
const forestGrid:number[][] = []

// Populate the grid
for await (const itemChars of rowCharReader) {
  forestGrid.push(itemChars.map(Number))
}

let visibleTrees = 0
let highestScenicScore = 0

const MAX_ROW_INDEX = forestGrid.length - 1
const MAX_COLUMN_INDEX = forestGrid[0].length - 1

for (let rowId = 0; rowId < forestGrid.length; rowId++) {
  for (let columnId = 0; columnId < forestGrid[rowId].length; columnId++) {
    // Mark trees along the edges as visible immediately
    if (rowId === 0 || columnId === 0 || rowId === MAX_ROW_INDEX || columnId === MAX_COLUMN_INDEX) {
      visibleTrees++
      continue
    }

    const treeHeight = forestGrid[rowId][columnId]

    let isVisible = false
    // [north, west, south, east]
    const treeScenicScores = [rowId, columnId, MAX_ROW_INDEX - rowId, MAX_COLUMN_INDEX - columnId]

    // Look north
    for (let i = rowId - 1; i >= 0; i--) {
      if (treeHeight <= forestGrid[i][columnId]) {
        // blocked
        treeScenicScores[0] = rowId - i
        break
      }
      if (i === 0) {
        isVisible = true
      }
    }

    // Look west
    for (let i = columnId - 1; i >= 0; i--) {
      if (treeHeight <= forestGrid[rowId][i]) {
        // blocked
        treeScenicScores[1] = columnId - i
        break
      }
      if (i === 0) {
        isVisible = true
      }
    }

    // Look south
    for (let i = rowId + 1; i <= MAX_ROW_INDEX; i++) {
      if (treeHeight <= forestGrid[i][columnId]) {
        // blocked
        treeScenicScores[2] = i - rowId
        break
      }
      if (i === MAX_ROW_INDEX) {
        isVisible = true
      }
    }

    // Look east
    for (let i = columnId + 1; i <= MAX_COLUMN_INDEX; i++) {
      if (treeHeight <= forestGrid[rowId][i]) {
        // blocked
        treeScenicScores[3] = i - columnId
        break
      }
      if (i === MAX_COLUMN_INDEX) {
        isVisible = true
      }
    }

    if (isVisible) {
      visibleTrees++
    }

    // Multiply everything together
    const treeScenicScore = treeScenicScores.reduce((a, b) => a * b, 1)
    if (treeScenicScore > highestScenicScore) {
      highestScenicScore = treeScenicScore
    }
  }
}

//console.debug(JSON.stringify(forestGrid))

console.log('[pt1] Visible trees: ' + visibleTrees)
console.log('[pt2] Highest scenic score: ' + highestScenicScore)
