#!/usr/bin/env -S deno run --allow-read

import { getInputLineStream } from '../helpers/file.ts'
import { usingSampleData, getInputFileName } from '../helpers/args.ts'

// Constants
const TARGET_ROW_INDEX = usingSampleData() ? 10 : 2000000

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

let topRow = Number.MAX_SAFE_INTEGER       // top == 0
let bottomRow = -1                         // bottom == height - 1
let leftmostCol = Number.MAX_SAFE_INTEGER  // left == 0
let rightmostCol = -1                      // right == width - 1

const sensorsMap = new Map<string, Sensor>()
const beaconsMap = new Map<string, Coordinate>()

// Assess each row
const SENSOR_REPORT_PARSER = /^Sensor at x=(-?\d+), y=(-?\d+): closest beacon is at x=(-?\d+), y=(-?\d+)$/
for await (const sensorReport of lineReader) {
  const [, sensorX, sensorY, beaconX, beaconY] = (SENSOR_REPORT_PARSER.exec(sensorReport) || []).map(Number)
  const sensor = new Sensor(
    new Coordinate(sensorX, sensorY),
    new Coordinate(beaconX, beaconY)
  )

  // Side effect: update the bounds
  const distance = sensor.detectibleRange
  const minX = sensorX - distance
  const maxX = sensorX + distance
  const minY = sensorY - distance
  const maxY = sensorY + distance
  if (minX < topRow) topRow = minX
  if (maxX > bottomRow) bottomRow = maxX
  if (minY < leftmostCol) leftmostCol = minY
  if (maxY > rightmostCol) rightmostCol = maxY

  // Store them... hopefully for some useful purpose
  sensorsMap.set(sensor.location.toString(), sensor)
  beaconsMap.set(sensor.nearestBeacon.toString(), sensor.nearestBeacon)
}

console.debug({ topRow, bottomRow, leftmostCol, rightmostCol })
//console.debug(sensorsMap)

const gridWidthPt1 = Math.abs(rightmostCol - leftmostCol) + 1
const gridHeightPt1 = Math.abs(bottomRow - topRow) + 1
const xOffsetPt1 = topRow
const yOffsetPt1 = leftmostCol

const targetX = TARGET_ROW_INDEX - xOffsetPt1

console.debug({ gridWidthPt1, gridHeightPt1, xOffsetPt1, yOffsetPt1, targetX })

// Create the overall map grid
const undergroundMapPt1:SpaceType[][] = new Array(gridHeightPt1).fill(0).map(() => new Array(gridWidthPt1).fill(SpaceType.Air))

const displayMap = function(undergroundMap:SpaceType[][]) {
  return undergroundMap.map(
    (row:SpaceType[], rowIndex) => `${(rowIndex  + xOffsetPt1).toString().padStart(3, ' ')} ${row.join('')}`
  ).join('\n')
}

function addSensorRangeSpotToMap(x:number, y:number, undergroundMap:SpaceType[][]):void {
  //console.debug({ type: SpaceType.SensorRange, x, y })

  // Ignore out-of-bounds spots
  // if (x < 0 || x >= gridWidthPt1 || y < 0 || y >= gridHeightPt1) {
  //   console.debug({ warning: 'OUT_OF_BOUNDS', type: SpaceType.SensorRange, x, y, logicalX: x + xOffsetPt1, logicalY: y + yOffsetPt1, gridWidthPt1, gridHeightPt1 })
  // }

  const spaceType = undergroundMap[x][y]
  if (spaceType === SpaceType.Air) {
    undergroundMap[x][y] = SpaceType.SensorRange
  }
}

/*
{ topRow: -8, bottomRow: 28, leftmostCol: -10, rightmostCol: 22 }
{ gridWidthPt1: 33, gridHeightPt1: 37, xOffsetPt1: -8, yOffsetPt1: -10 }
*/
const addSensorToMap = function(sensor:Sensor, undergroundMap:SpaceType[][]):void {
  // Add the sensor to the map
  const sensorX = sensor.location.x - xOffsetPt1
  const sensorY = sensor.location.y - yOffsetPt1
  //console.debug({ type: SpaceType.Sensor, x: sensor.location.x, y: sensor.location.y, sensorX, sensorY })
  undergroundMap[sensorX][sensorY] = SpaceType.Sensor

  // Add the beacon to the map
  const beaconX = sensor.nearestBeacon.x - xOffsetPt1
  const beaconY = sensor.nearestBeacon.y - yOffsetPt1
  //console.debug({ type: SpaceType.Beacon, x: sensor.nearestBeacon.x, y: sensor.nearestBeacon.y, beaconX, beaconY })
  undergroundMap[beaconX][beaconY] = SpaceType.Beacon

  // Add the sensor's range to the map
  const distance = sensor.detectibleRange
  for (let x = distance; x >= 0; x--) {
    for (let y = distance - x; y >= 0; y--) {
      addSensorRangeSpotToMap(sensorX + x, sensorY + y, undergroundMap)
      addSensorRangeSpotToMap(sensorX + x, sensorY - y, undergroundMap)
      addSensorRangeSpotToMap(sensorX - x, sensorY + y, undergroundMap)
      addSensorRangeSpotToMap(sensorX - x, sensorY - y, undergroundMap)
    }
  }
}

//console.debug(displayMap(undergroundMapPt1) + '\n')
//console.debug(displayMap(undergroundMapPt2) + '\n')

// Add the sensors and known beacons to the map
for (const sensor of sensorsMap.values()) {
  //console.debug(sensor.toString())
  addSensorToMap(sensor, undergroundMapPt1)
  //console.debug(displayMap(undergroundMapPt1) + '\n')
  //await new Promise(resolve => setTimeout(resolve, 500))
}

console.debug(displayMap(undergroundMapPt1) + '\n')
// console.debug(displayMap(undergroundMapPt2) + '\n')

//const targetX = TARGET_ROW_INDEX - xOffsetPt1
const targetRow = undergroundMapPt1[targetX]
// ⬜⬜⬜⬜⬜⬜⬜⬜✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨🚨✨✨✨🟡✨✨
//console.debug(targetRow.join(''))
const unbeaconableSpots = targetRow.filter((spaceType:SpaceType) => [SpaceType.Sensor, SpaceType.SensorRange].includes(spaceType))
// ✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨🟡✨✨
//console.debug(unbeaconableSpots.join(''))
const unbeaconablePositionsPt1 = unbeaconableSpots.length

console.log(`[pt1] Un-beacon-able positions within row ${TARGET_ROW_INDEX}: ${unbeaconablePositionsPt1}`)
console.log('[pt2] ???: ' + 0)
