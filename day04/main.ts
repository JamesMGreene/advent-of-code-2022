#!/usr/bin/env -S deno run --allow-read

import { getInputRowStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'
import { _ } from '../helpers/lodash.ts'

//
// Processing functions
//
function getRange(input:string) : number[] {
  const [min, max] = input.split('-').map(Number)
  return _.range(min, max + 1)
}

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const rowRangeReader = await getInputRowStream(getInputFileName(), { delimiter: ',' })

let fullOverlaps = 0
let partialOverlaps = 0

// Assess each row of items
for await (const [firstAssignment, secondAssignment] of rowRangeReader) {
  const firstRange = getRange(firstAssignment)
  const secondRange = getRange(secondAssignment)
  const overlap = _.intersection(firstRange, secondRange)
  if (overlap.length === firstRange.length || overlap.length === secondRange.length) {
    fullOverlaps++
  }
  if (overlap.length > 0) {
    partialOverlaps++
  }
}

console.log('[pt1] Overlaps: ' + fullOverlaps)
console.log('[pt2] Partial overlaps: ' + partialOverlaps)
