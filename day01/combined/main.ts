#!/usr/bin/env -S deno run --allow-read

import { getInputSectionStream } from '../../helpers/file.ts'
import { sortAscending } from '../../helpers/array.ts'
import { _ } from '../../helpers/lodash.ts'
import { getInputFileName } from '../../helpers/args.ts'

// Prepare the processing functions
const highestValues = [0, 0, 0]

function maybeUpdateHighestValues(currentSum:number) {
  // If the current sum is higher than the previous highest value,
  // update the highest value
  if (currentSum > highestValues[0]) {
    highestValues[0] = currentSum

    // Follow-up sorting
    sortAscending(highestValues)
  }
}

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const sectionReader = await getInputSectionStream('../' + getInputFileName())

// Assess each group of numbers
for await (const lines of sectionReader) {
  // ⚠️ If there are a lot of lines, this could get slow as we already read them once creating the SectionReader
  const currentSum = _.sumBy(lines, Number)
  maybeUpdateHighestValues(currentSum)
}

//console.log('Highest values: ' + JSON.stringify(highestValues))
console.log('[pt1] Highest value: ' + highestValues[2])
console.log('[pt2] Highest 3 values, summed: ' + _.sum(highestValues))
