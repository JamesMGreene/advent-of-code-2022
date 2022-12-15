#!/usr/bin/env -S deno run --allow-read

import { getInputLineStream } from '../helpers/file.ts'
import { usingSampleData, getInputFileName } from '../helpers/args.ts'

// Constants
const TARGET_ROW_INDEX = usingSampleData() ? 10 : 2000000
const TUNING_FREQUENCY_MULTIPLIER = 4000000

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
}

class Sensor {
  location: Coordinate
  nearestBeacon: Coordinate
  _detectibleRange: number

  constructor(location:Coordinate, nearestBeacon:Coordinate) {
    this.location = location
    this.nearestBeacon = nearestBeacon
    this._detectibleRange = 0
  }

  get detectibleRange(): number {
    // Calculate and memoize
    if (this._detectibleRange === 0) {
      const xDistance = Math.abs(this.location.x - this.nearestBeacon.x)
      const yDistance = Math.abs(this.location.y - this.nearestBeacon.y)
      this._detectibleRange = xDistance + yDistance
    }
    return this._detectibleRange
  }

  toString() {
    return `Sensor at ${this.location} detected Beacon at ${this.nearestBeacon} (distance: ${this.detectibleRange})`
  }
}

enum SpaceType {
  // Air = '.',
  // Sensor = 'S',
  // SensorRange = '#',
  // Beacon = 'B',
  Air = '⬜',
  Sensor = '🟡',
  SensorRange = '✨',
  Beacon = '🚨'
}

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const lineReader = await getInputLineStream(getInputFileName())

let leftmostCol = Number.MAX_SAFE_INTEGER  // left == 0
let rightmostCol = -1                      // right == width - 1

const sensorsMap = new Map<string, Sensor>()

// Assess each row
const SENSOR_REPORT_PARSER = /^Sensor at x=(-?\d+), y=(-?\d+): closest beacon is at x=(-?\d+), y=(-?\d+)$/
for await (const sensorReport of lineReader) {
  const [, sensorX, sensorY, beaconX, beaconY] = (SENSOR_REPORT_PARSER.exec(sensorReport) || []).map(Number)
  const sensor = new Sensor(
    new Coordinate(sensorX, sensorY),
    new Coordinate(beaconX, beaconY)
  )

  const distance = sensor.detectibleRange

  // Side effect: update the bounds
  const minX = sensorX - distance
  const maxX = sensorX + distance
  if (minX < leftmostCol) leftmostCol = minX
  if (maxX > rightmostCol) rightmostCol = maxX

  // Only store the sensor if its detectible range includes the target row
  const minY = sensorY - distance
  const maxY = sensorY + distance
  if (minY <= TARGET_ROW_INDEX && TARGET_ROW_INDEX <= maxY) {
    // Store them... hopefully for some useful purpose
    sensorsMap.set(sensor.location.toString(), sensor)
  }
}

console.debug(sensorsMap)

const gridWidthPt1 = rightmostCol - leftmostCol + 1
const xOffsetPt1 = leftmostCol

console.debug({ leftmostCol, rightmostCol, gridWidthPt1, xOffsetPt1 })

// Create the target map row
const targetRowMapPt1:SpaceType[] = new Array(gridWidthPt1).fill(SpaceType.Air)

const displayRowMap = function(targetRowMap:SpaceType[]) {
  return `${TARGET_ROW_INDEX} ${targetRowMap.join('')}`
}

function getTuningFrequency(beacon:Coordinate):number {
  return (beacon.x * TUNING_FREQUENCY_MULTIPLIER) + beacon.y
}

function addSensorRangeSpotToMap(x:number, undergroundRowMap:SpaceType[]):void {
  const spaceType = undergroundRowMap[x]
  if (spaceType === SpaceType.Air) {
    undergroundRowMap[x] = SpaceType.SensorRange
  }
}

const addSensorToMap = function(sensor:Sensor, undergroundRowMap:SpaceType[]):void {
  // Add the sensor to the map
  const sensorX = sensor.location.x - xOffsetPt1
  const sensorY = sensor.location.y
  if (sensorY === TARGET_ROW_INDEX) {
    undergroundRowMap[sensorX] = SpaceType.Sensor
  }

  // Add the beacon to the map
  const beaconX = sensor.nearestBeacon.x - xOffsetPt1
  const beaconY = sensor.nearestBeacon.y
  if (beaconY === TARGET_ROW_INDEX) {
    undergroundRowMap[beaconX] = SpaceType.Beacon
  }

  // Add the sensor's range to the map
  const distance = sensor.detectibleRange
  const distanceFromSensorToTargetRow = Math.abs(sensorY - TARGET_ROW_INDEX)
  const rangeForX = distance - distanceFromSensorToTargetRow

  console.debug({ sensorX, sensorY, distance, distanceFromSensorToTargetRow, rangeForX })

  for (let x = rangeForX; x >= 0; x--) {
    addSensorRangeSpotToMap(sensorX + x, undergroundRowMap)
    addSensorRangeSpotToMap(sensorX - x, undergroundRowMap)
  }
}

//console.debug(displayRowMap(targetRowMapPt1) + '\n')
//console.debug(displayRowMap(undergroundMapPt2) + '\n')

// Add the sensors and known beacons to the map
for (const sensor of sensorsMap.values()) {
  //console.debug(sensor.toString())
  addSensorToMap(sensor, targetRowMapPt1)
  //console.debug(displayRowMap(targetRowMapPt1) + '\n')
  //await new Promise(resolve => setTimeout(resolve, 500))
}

//console.debug('Row:\n' + displayRowMap(targetRowMapPt1) + '\n')

// console.debug(displayRowMap(undergroundMapPt2) + '\n')

const unbeaconableSpotsCount = targetRowMapPt1.reduce(
  (acc, spaceType:SpaceType) => acc + ([SpaceType.Sensor, SpaceType.SensorRange].includes(spaceType) ? 1 : 0),
  0
)

console.log(`[pt1] Un-beacon-able positions within row ${TARGET_ROW_INDEX}: ${unbeaconableSpotsCount}`)
console.log('[pt2] ???: ' + 0)
