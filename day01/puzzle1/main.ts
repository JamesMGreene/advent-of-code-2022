#!/usr/bin/env -S deno run --allow-read

import { getInputLineStream } from '../../helpers/file.ts'

// Prepare the processing functions
let highestValue = 0
let currentSum = 0

function maybeUpdateHighestValue() {
  // If the current sum is higher than the previous highest value,
  // update the highest value
  if (currentSum > highestValue) {
    highestValue = currentSum
  }
  currentSum = 0
}


// Get a readable stream from the input file doesn't have to be fully loaded into memory
const lineReader = await getInputLineStream()

// Assess each group of numbers
for await (const line of lineReader) {
  // If we hit a break (empty line), that means we're moving onto the next group
  if (line === '') {
    maybeUpdateHighestValue()
    continue
  }

  // Convert the line into a number
  const lineValue = Number(line)

  // Add the line to the current sum
  currentSum += lineValue  
}

// Final update/check after hitting the end of the file
maybeUpdateHighestValue()

console.log('Highest value: ' + highestValue)
