#!/usr/bin/env -S deno run --allow-read

import { getInputLineStream } from '../../helpers/file.ts'

// Prepare the processing functions
const highestValues = [0, 0, 0]
let currentSum = 0

function maybeUpdateHighestValues() {
  // If the current sum is higher than the previous highest value,
  // update the highest value
  if (currentSum > highestValues[2]) {
    highestValues[2] = currentSum

    // Follow up sorting
    if (highestValues[2] > highestValues[1]) {
      let temp = highestValues[1]
      highestValues[1] = highestValues[2]
      highestValues[2] = temp

      if (highestValues[1] > highestValues[0]) {
        temp = highestValues[0]
        highestValues[0] = highestValues[1]
        highestValues[1] = temp
      }
    }
  }

  currentSum = 0
}

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const lineReader = await getInputLineStream()

// Assess each group of numbers
for await (const line of lineReader) {
  // If we hit a break (empty line), that means we're moving onto the next group
  if (line === '') {
    maybeUpdateHighestValues()
    continue
  }

  // Convert the line into a number
  const lineValue = Number(line)

  // Add the line to the current sum
  currentSum += lineValue  
}

// Final update/check after hitting the end of the file
maybeUpdateHighestValues()

console.log('Highest values: ' + JSON.stringify(highestValues))
console.log('Highest values, summed: ' + highestValues.reduce((acc, current) => acc + current, 0))
