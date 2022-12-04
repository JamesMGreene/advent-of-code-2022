#!/usr/bin/env -S deno run --allow-read

import { getInputRowStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'

interface IRange {
  min: number,
  max: number
}

enum OverlapType {
  None = 'none',
  Partial = 'partial',
  Full = 'full'
}

//
// Processing functions
//
function getRange(input:string) : IRange {
  const [min, max] = input.split('-').map(Number)
  return { min, max }
}

function getBidirectionalOverlapType(range1:IRange, range2:IRange) : OverlapType {
  // Ranges do not overlap at all
  if (range1.max < range2.min || range2.max < range1.min) {
    return OverlapType.None
  }

  if (
    // if range1 fully contains range2
    (range1.min <= range2.min && range1.max >= range2.max) ||
    // if range2 fully contains range1
    (range2.min <= range1.min && range2.max >= range1.max)
  ) {
    return OverlapType.Full
  }

  // if range1 overlaps range2 on the left
  // if range2 overlaps range1 on the left
  // if range1 overlaps range2 on the right
  // if range2 overlaps range1 on the right
  return OverlapType.Partial
}

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const rowRangeReader = await getInputRowStream(getInputFileName(), { delimiter: ',' })

let fullOverlaps = 0
let partialOverlaps = 0

// Assess each row of items
for await (const [firstAssignment, secondAssignment] of rowRangeReader) {
  const firstRange = getRange(firstAssignment)
  const secondRange = getRange(secondAssignment)

  const overlapType = getBidirectionalOverlapType(firstRange, secondRange)
  if (overlapType === OverlapType.Full) {
    fullOverlaps++
    partialOverlaps++
  } else if (overlapType === OverlapType.Partial) {
    partialOverlaps++
  }
}

console.log('[pt1] Full overlaps: ' + fullOverlaps)
console.log('[pt2] Partial overlaps: ' + partialOverlaps)
