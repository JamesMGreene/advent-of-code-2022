#!/usr/bin/env -S deno run --allow-read

import { getInputSectionStream } from '../helpers/file.ts'
import { _ } from '../helpers/lodash.ts'
import { getInputFileName } from '../helpers/args.ts'

// Prepare the processing functions
function compareIntsAscending(a: number, b: number): number {
  return a - b
}

interface CompositeList extends Array<any> {
  [key: number]: number|CompositeList
}

function compareItems(a: CompositeList|number, b: CompositeList|number): number {
  const aIsNumber = typeof a === 'number'
  const bIsNumber = typeof b === 'number'
  const aIsArray = Array.isArray(a)
  const bIsArray = Array.isArray(b)

  if (aIsNumber && bIsNumber) {
    return compareIntsAscending(a, b)
  }

  const aAsArray = aIsArray ? a : [a]
  const bAsArray = bIsArray ? b : [b]
  return compareLists(aAsArray, bAsArray)
}

function compareLists(a: CompositeList, b: CompositeList): number {
  const aLength = a.length
  const bLength = b.length
  const greaterLength = Math.max(aLength, bLength)
  
  for (let i = 0; i < greaterLength; i++) {
    const aItem = a[i]
    const bItem = b[i]
    if (aItem === undefined) {
      // Right order
      return -1
    }
    if (bItem === undefined) {
      // Wrong order
      return 1
    }

    const comparison = compareItems(aItem, bItem)
    if (comparison !== 0) {
      return comparison
    }
  }

  // Equal
  return 0
}

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const sectionReader = await getInputSectionStream(getInputFileName())

// Assess each group
let pairIndex = 1
let rightOrderCount = 0
const allLists:CompositeList[] = []

for await (const [part1, part2] of sectionReader) {
  // ⚠️ If there are a lot of lines, this could get slow as we already read them once creating the SectionReader
  const list1 = JSON.parse(part1)
  const list2 = JSON.parse(part2)

  // Track all for part 2
  allLists.push(list1)
  allLists.push(list2)

  const comparison = compareLists(list1, list2)
  if (comparison < 1) {
    rightOrderCount += pairIndex
  }
  pairIndex++
}

// Part 2
// Add divider packets
const divider1 = [[2]]
const divider2 = [[6]]
allLists.push(divider1)
allLists.push(divider2)

// Sort the list
allLists.sort(compareLists)
//console.debug(JSON.stringify(allLists, null, 2))
let dividerIndex1 = 0
let dividerIndex2 = 0
for (let i = 0; i < allLists.length; i++) {
  if (allLists[i] === divider1) {
    dividerIndex1 = i + 1
    if (dividerIndex2 > 0) {
      break
    }
  }
  else if (allLists[i] === divider2) {
    dividerIndex2 = i + 1
    if (dividerIndex1 > 0) {
      break
    }
  }
}

console.log('[pt1] Packet pairs in the right order: ' + rightOrderCount)
console.log('[pt2] Divider order multiple: ' + (dividerIndex1 * dividerIndex2))
