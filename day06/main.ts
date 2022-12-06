#!/usr/bin/env -S deno run --allow-read

import { getInputCharStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'
import { _ } from '../helpers/lodash.ts'

//
// Processing functions
//
function createUniqueSequenceAnalyzer(expectedLength:number) {
  const sequence:string[] = Array(expectedLength).fill('')
  let calledEnough = false
  let callCount = 0

  return (char:string) => {
    sequence.shift()
    sequence.push(char)
    if (!calledEnough) {
      callCount++
      if (callCount < expectedLength) {
        return false
      }
      calledEnough = true
    }

    return _.uniq(sequence).length === expectedLength
  }
}

const assessPacketMarkerSequence = createUniqueSequenceAnalyzer(4)
const assessMessageMarkerSequence = createUniqueSequenceAnalyzer(14)


// Get a readable stream from the input file doesn't have to be fully loaded into memory
const charReader = await getInputCharStream(getInputFileName())
let charIndex = 0

let packetMarker = 0
let messageMarker = 0

// Assess each row of items
for await (const char of charReader) {
  charIndex++
  if (!packetMarker) {
    const foundPacketMarker = assessPacketMarkerSequence(char)
    if (foundPacketMarker) {
      packetMarker = charIndex
    }
  }
  if (!messageMarker) {
    const foundMessageMarker = assessMessageMarkerSequence(char)
    if (foundMessageMarker) {
      messageMarker = charIndex
      break // all done
    }
  }
}

console.log('[pt1] First packet marker: ' + packetMarker)
console.log('[pt2] First message marker: ' + messageMarker)
