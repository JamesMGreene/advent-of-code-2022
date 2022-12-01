#!/usr/bin/env -S deno run --allow-read

import * as path from 'https://deno.land/std/path/mod.ts'
import { TextLineStream } from 'https://deno.land/std/streams/text_line_stream.ts'

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
