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

  const range1_min_lte_range2_min = range1.min <= range2.min
  const range1_max_gte_range2_max = range1.max >= range2.max
  const range2_min_lte_range1_min = range2.min <= range1.min
  const range2_max_gte_range1_max = range2.max >= range1.max
  if (
    // range1 fully contains range2
    (range1_min_lte_range2_min && range1_max_gte_range2_max) ||
    // range2 fully contains range1
    (range2_min_lte_range1_min && range2_max_gte_range1_max)
  ) {
    return OverlapType.Full
  }

  const range1_max_lte_range2_max = range1.max <= range2.max
  const range2_max_lte_range1_max = range2.max <= range1.max
  if (
    // range1 overlaps range2 on the left
    (range1_min_lte_range2_min && range1_max_lte_range2_max) ||
    // range2 overlaps range1 on the left
    (range2_min_lte_range1_min && range2_max_lte_range1_max)
  ) {
    return OverlapType.Partial
  }

  const range1_min_gte_range2_min = range1.min >= range2.min
  const range2_min_gte_range1_min = range2.min >= range1.min
  if (
    // range1 overlaps range2 on the right
    (range1_min_gte_range2_min && range1_max_gte_range2_max) ||
    // range2 overlaps range1 on the right
    (range2_min_gte_range1_min && range2_max_gte_range1_max)
  ) {
    return OverlapType.Partial
  }

  throw new Error('Should identified an OverlapType by now!')
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
