#!/usr/bin/env -S deno run --allow-read

import { getInputLineStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'
import dijkstra from 'https://deno.land/x/dijkstra/mod.ts'
// import { BSTree } from 'https://deno.land/x/collections/mod.ts'

const TIME_LIMIT = 30 // minutes

//
// Processing functions
//

// e.g. "AA:CC" = ["AA", "BB", "CC"]
const valveBestPathMap = new Map<string, string[]>()

class Valve {
  name: string
  flowRate: number
  adjacentValveNames: string[]
  isOpen: boolean

  constructor(name: string, flowRate: number, adjacentValveNames: string[]) {
    this.name = name
    this.flowRate = flowRate
    this.adjacentValveNames = adjacentValveNames
    this.isOpen = false
  }

  openUp():number {
    if (this.isOpen) {
      throw new Error('Valve is already open!')
    }

    this.isOpen = true
    return this.flowRate
  }

  get potentialFlowRate() {
    return this.isOpen ? 0 : this.flowRate
  }

  potentialPressureRelease(timeRemaining:number):number {
    return Math.max(this.potentialFlowRate * timeRemaining, 0)
  }
}

function generateGraphFromValveMap(valveMap: Map<string, Valve>) {
  const graph: { [key: string]: { [key: string]: number } } = {}

  for (const [valveName, valve] of valveMap) {
    graph[valveName] = {}
    for (const adjacentValveName of valve.adjacentValveNames) {
      graph[valveName][adjacentValveName] = 1
    }
  }

  return graph
}

//
// Main
//

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const lineReader = await getInputLineStream(getInputFileName())

const valveMap = new Map<string, Valve>()
type FlowRate = { valveName: string, flowRate: number }
const flowRates:FlowRate[] = []

// Assess each row
const PIPE_SCHEMA_PARSER = /^Valve ([A-Z]{2}) has flow rate=(\d+); tunnels? leads? to valves? ((?:[A-Z]{2})(?:, [A-Z]{2})*)$/
for await (const pipeReport of lineReader) {
  if (pipeReport === '') continue

  const [, valveName, flowRateStr, adjacentValvesStr] = PIPE_SCHEMA_PARSER.exec(pipeReport) || []
  const flowRate = Number(flowRateStr)
  const adjacentValveNames = adjacentValvesStr.split(', ')

  //console.debug(`Valve ${valveName} has flow rate ${flowRate} and tunnels to ${adjacentValveNames.join(';')}`)

  valveMap.set(valveName, new Valve(valveName, flowRate, adjacentValveNames))
  flowRates.push({ valveName, flowRate })
}

// Sort by descending flow rates
flowRates.sort((a, b) => b.flowRate - a.flowRate)

console.debug({ flowRates })

// Initial value is always "AA"
let currentValve = valveMap.get('AA')
// It's the final countdown! 🌋
let timeRemaining = TIME_LIMIT
// Cumulative pressure release
let totalPressureReleased = 0

const graph = generateGraphFromValveMap(valveMap)
console.debug(graph)

console.debug(`T-minus ${timeRemaining} minutes: at ${currentValve!.name}, pressured released so far: ${totalPressureReleased}}`)
while (timeRemaining > 0) {
  let largestFlowRate = flowRates.shift()
  let largestFlowRateValve = valveMap.get(largestFlowRate!.valveName)

  console.debug(`Heading to ${largestFlowRateValve!.name} with flow rate ${largestFlowRateValve!.flowRate}`)

  let shortestPath = dijkstra.find_path(graph, currentValve!.name, largestFlowRateValve!.name)
  shortestPath.shift() // Remove the first element, which is the current valve

  console.debug({ shortestPath })
  for (let v = 0; v < shortestPath.length && timeRemaining > 0; v++) {
    const valveName = shortestPath[v]

    // Move to the next valve
    currentValve = valveMap.get(valveName)
    timeRemaining--

    console.debug({ timeRemaining, valveName, isOpen: currentValve!.isOpen, flowRate: currentValve!.flowRate, potentialPressureRelease: currentValve!.potentialPressureRelease(timeRemaining - 1) })

    console.debug(`T-minus ${timeRemaining} minutes: at ${currentValve!.name}, pressured released so far: ${totalPressureReleased}}`)

    if (!currentValve!.isOpen) {
      let potential = currentValve!.potentialPressureRelease(timeRemaining - 1)
      let before = totalPressureReleased
      totalPressureReleased += currentValve!.potentialPressureRelease(timeRemaining - 1)
      console.debug({ totalPressureReleasedBefore: before, potentialPressureRelease: potential, totalPressureReleasedAfter: totalPressureReleased })
      currentValve!.openUp()
      timeRemaining--

      console.debug(`T-minus ${timeRemaining} minutes: at ${currentValve!.name}, pressured released so far: ${totalPressureReleased}`)
    }
  }

  // // bestPathPt1[0] === startPoint.toString()
  // const bestStepCountPt1 = bestPathPt1.length - 1

}

console.log('[pt1] ???: ' + 0)
console.log('[pt2] ???: ' + 0)
