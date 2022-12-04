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

function getOverlapType(range1:IRange, range2:IRange) : OverlapType {
  // Left overlap
  if (range1.min <= range2.min) {
    if (range1.max >= range2.max) {
      return OverlapType.Full
    } else if (range1.max >= range2.min) {
      return OverlapType.Partial
    }
  }
  // Right overlap
  else if (range1.min <= range2.max && range1.max >= range2.max) {
    return OverlapType.Partial
  }
  return OverlapType.None
}

function getBidirectionalOverlapType(range1:IRange, range2:IRange) : OverlapType {
  const overlap1 = getOverlapType(range1, range2)
  //console.debug('range1', range1, 'range2', range2)
  //console.debug('overlap1', overlap1)
  if (overlap1 !== OverlapType.Full) {
    const overlap2 = getOverlapType(range2, range1)
    //console.debug('overlap2', overlap2)
    return overlap2
  }
  return overlap1
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
  if (overlapType === 'full') {
    fullOverlaps++
    partialOverlaps++
  } else if (overlapType === 'partial') {
    partialOverlaps++
  }
}

console.log('[pt1] Full overlaps: ' + fullOverlaps)
console.log('[pt2] Partial overlaps: ' + partialOverlaps)
