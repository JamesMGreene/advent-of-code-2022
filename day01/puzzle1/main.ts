#!/usr/bin/env -S deno run --allow-read

import { getInputSectionStream } from '../../helpers/file.ts'
import { sumLines } from '../../helpers/array.ts'
import { getInputFileName } from '../../helpers/args.ts'

// Prepare the processing functions
let highestValue = 0

function maybeUpdateHighestValue(currentSum:number) {
  // If the current currentSum is higher than the previous highest value,
  // update the highestValue
  if (currentSum > highestValue) {
    highestValue = currentSum
  }
}

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const sectionReader = await getInputSectionStream('../' + getInputFileName())

// Assess each group of numbers
for await (const lines of sectionReader) {
  // ⚠️ If there are a lot of lines, this could get slow as we already read them once creating the SectionReader
  const currentSum = sumLines(lines)
  maybeUpdateHighestValue(currentSum)
}

console.log('Highest value: ' + highestValue)
