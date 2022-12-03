#!/usr/bin/env -S deno run --allow-read

import { getInputRowStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'

//
// Processing functions
//
function getItemPriority(itemChar:string) {
  const itemCharCode = itemChar.charCodeAt(0)
  // a - z
  if (itemCharCode >= 97 && itemCharCode <= 122) {
    return itemCharCode - 96
  }
  // A - Z
  if (itemCharCode >= 65 && itemCharCode <= 90) {
    return itemCharCode - 38
  }
  return 0
}

function getIntersection(a:Set<string>, b:Set<string>) {
  return new Set([...a].filter(item => b.has(item)))
}


// Get a readable stream from the input file doesn't have to be fully loaded into memory
const rowCharReader = await getInputRowStream(getInputFileName(), { delimiter: '' })

let cumulativeItemPriority = 0

let rowIndex = 0
let cumulativeBadgePriority = 0
const currentGroup:Set<string>[] = [new Set(), new Set(), new Set()]

// Assess each row of items
for await (const itemChars of rowCharReader) {
  const compartmentSize = itemChars.length / 2
  const firstCompartmentItems = itemChars.slice(0, compartmentSize)
  const secondCompartmentItems = itemChars.slice(compartmentSize)

  const firstUniqueItems = new Set(firstCompartmentItems)
  const secondUniqueItems = new Set(secondCompartmentItems)
  const intersection = getIntersection(firstUniqueItems, secondUniqueItems)
  const [intersectionItem] = intersection
  const itemPriority = getItemPriority(intersectionItem)
  
  cumulativeItemPriority += itemPriority

  // console.debug(intersection, priority)

  currentGroup[rowIndex % 3] = new Set(itemChars)
  rowIndex++
  // Assess for badge after every 3rd row
  if (rowIndex % 3 === 0) {
    const groupIntersection = [...getIntersection(getIntersection(currentGroup[0], currentGroup[1]), currentGroup[2])]
    const [groupBadge] = groupIntersection
    const badgePriority = getItemPriority(groupBadge)
    cumulativeBadgePriority += badgePriority

    // console.debug(groupIntersection, badgePriority)
  }
}

console.log('[pt1] Cumulative item priority: ' + cumulativeItemPriority)
console.log('[pt2] Cumulative badge priority: ' + cumulativeBadgePriority)
