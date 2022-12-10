import { getInputRowStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'

//
// Prepare the processing functions
//
function calculatePart1() {
  // Just return the last value of signalRegister if there were less than 20 cycles run
  if (cycleStrengthRecords.length < 20) {
    return signalRegister
  }

  const sum = (
    (cycleStrengthRecords[19] || 0) +
    (cycleStrengthRecords[59] || 0) +
    (cycleStrengthRecords[99] || 0) +
    (cycleStrengthRecords[139] || 0) +
    (cycleStrengthRecords[179] || 0) +
    (cycleStrengthRecords[219] || 0)
  )
  return sum
}

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const instructionReader = await getInputRowStream(getInputFileName())

let signalRegister = 1
const cycleStrengthRecords:number[] = []
// Screen is 40 pixels wide by 6 pixels tall
const crtScreen:string[][] = Array(6).fill(0).map(_ => Array(40).fill('.'))

for await (const [instruction, value] of instructionReader) {
  let cycleIndex = cycleStrengthRecords.length
  let cycleNumber = cycleIndex + 1
  let crtRow = Math.floor(cycleIndex / 40)
  let crtCol = cycleIndex % 40

  console.debug({ cycleIndex, cycleNumber, crtRow, crtCol, signalRegister })
  //console.debug(`Signal register starting cycle #${cycleNumber}: ${signalRegister}`)

  if (instruction === 'noop') {
    // Spend 1 cycle doing nothing
    if (crtCol >= signalRegister - 1 && crtCol <= signalRegister + 1) {
      crtScreen[crtRow][crtCol] = '#'
    }
    cycleStrengthRecords.push(signalRegister * cycleNumber)
  }
  else if (instruction === 'addx') {
    // Spend 2 cycles adding the value to the signal register
    const valueNum = Number(value)
    if (crtCol >= signalRegister - 1 && crtCol <= signalRegister + 1) {
      crtScreen[crtRow][crtCol] = '#'
    }
    cycleStrengthRecords.push(signalRegister * cycleNumber)

    // Take a second cycle
    cycleIndex++
    cycleNumber = cycleIndex + 1
    crtRow = Math.floor(cycleIndex / 40)
    crtCol = cycleIndex % 40

    console.debug({ cycleIndex, cycleNumber, crtRow, crtCol, signalRegister })
    //console.debug(`Signal register starting cycle #${cycleNumber}: ${signalRegister}`)

    if (crtCol >= signalRegister - 1 && crtCol <= signalRegister + 1) {
      crtScreen[crtRow][crtCol] = '#'
    }
    cycleStrengthRecords.push(signalRegister * cycleNumber)

    signalRegister += valueNum
  }
}
//console.debug(`Final register value after cycle #${cycleStrengthRecords.length + 1}: ${signalRegister}`)

console.log('[pt1] Sum of stuff: ' + calculatePart1())
console.log('[pt2] CRT screen output:\n' + crtScreen.map(row => row.join('')).join('\n'))
