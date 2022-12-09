#!/usr/bin/env -S deno run --allow-read

import { getInputRowStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'

//
// Processing functions
//

class Coordinate {
  x: number
  y: number

  constructor(x:number = 0, y:number = 0) {
    this.x = x
    this.y = y
  }

  toString() {
    return `${this.x},${this.y}`
  }

  stepInDirection(direction:string) {
    const distance = 1
    switch (direction) {
      case 'U':
        this.y += distance
        break
      case 'D':
        this.y -= distance
        break
      case 'L':
        this.x -= distance
        break
      case 'R':
        this.x += distance
        break
    }
  }

  distanceTo(other:Coordinate) {
    const xDist = Math.abs(this.x - other.x)
    const yDist = Math.abs(this.y - other.y)

    // Handle diagonals with a slope of 1
    if (xDist === yDist) {
      return xDist
    }

    return xDist + yDist
  }

  moveToward(other:Coordinate) {
    const xDist = other.x - this.x
    const yDist = other.y - this.y

    const xMove = xDist === 0 ? 0 : (xDist > 0 ? 1 : -1)
    const yMove = yDist === 0 ? 0 : (yDist > 0 ? 1 : -1)

    this.x += xMove
    this.y += yMove
  }
}

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const instructionReader = await getInputRowStream(getInputFileName())

const singleTailVisits = new Set<string>()
const multiTailVisits = new Set<string>()
const head = new Coordinate(0, 0)
const tail = new Coordinate(0, 0)
const tails = Array(9).fill(0).map(_ => new Coordinate(0, 0))

// Don't forget tail visited the origin!
singleTailVisits.add(tail.toString())
multiTailVisits.add(tails[0].toString())

for await (const [direction, distance] of instructionReader) {
  let distanceNum = Number(distance)
  if (!['U', 'D', 'L', 'R'].includes(direction)) {
    console.debug(`Invalid direction: ${direction}`)
    continue
  }

  console.debug(`Moving ${direction} ${distance} spaces`)
  console.debug(`Head position: ${head}`)
  console.debug(`Tail position: ${tail}\n`)

  while (distanceNum > 0) {
    console.debug(`Moving ${direction} ${distance} spaces: ${distanceNum} moves remaining...`)
    distanceNum--

    const originalHead = head.toString()
    const originalTail = tail.toString() // Should also be equal to tails[0].toString()

    head.stepInDirection(direction)
    console.debug(`Head moved: ${originalHead} => ${head}\n`)

    // If the tail is within 1 space, don't move it
    if (tail.distanceTo(head) <= 1) {
      console.debug(`Tail unmoved, still within 1 space: ${originalTail}\n`)
    } else {
      // Move?
      tail.moveToward(head)
      console.debug(`Tail moved: ${originalTail} => ${tail}\n`)

      // Note the tail's position
      singleTailVisits.add(tail.toString())
    }

    for (let i = 0; i < tails.length; i++) {
      const originalTail = tails[i].toString()
      const leader = i === 0 ? head : tails[i - 1]
      
      // If the tail is within 1 space, don't move it
      if (tails[i].distanceTo(leader) <= 1) {
        console.debug(`Tail #${i + 1} unmoved, still within 1 space: ${originalTail}\n`)
        break
      }

      console.debug(`Tail #${i + 1} following leader at: ${leader}`)
      tails[i].moveToward(leader)
      console.debug(`Tail #${i + 1} moved: ${originalTail} => ${tails[i]}`)
    }
    console.debug('')

    // Note the final tail's position
    multiTailVisits.add(tails[tails.length - 1].toString())
  }
  console.debug('---')
}

console.log('[pt1] Single-tail visited points: ' + singleTailVisits.size)
console.log('[pt2] Multi-tail visited points: ' + multiTailVisits.size)
