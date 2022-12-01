#!/usr/bin/env -S deno run --allow-read

import * as path from 'https://deno.land/std/path/mod.ts'
import { TextLineStream } from 'https://deno.land/std/streams/text_line_stream.ts'

// Prepare the processing functions
let highestValues = [0, 0, 0]
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

// Figure out the file path relative to this script file
const mainModuleDir = path.dirname(path.fromFileUrl(Deno.mainModule))
const inputFilePath = path.resolve(mainModuleDir, '../input.txt')

// Try opening the input file; if it fails, let the error propagate
const inputFile = await Deno.open(inputFilePath, { read: true })

// Build a readable stream so the file doesn't have to be fully loaded into
// memory while we send it
const inputReader = inputFile.readable

const readable = inputReader!
  .pipeThrough(new TextDecoderStream()) // convert Uint8Array to string
  .pipeThrough(new TextLineStream())    // transform into a stream where each chunk is divided by a newline

// Assess each group of numbers
for await (const line of readable) {
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
