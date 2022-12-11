import { getInputSectionStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'
import { _ } from '../helpers/lodash.ts'

const PART_NUMBER = 1
const ROUND_COUNT = 20
const RELIEF_FACTOR = 3

//
// Processing functions
//
let sequenceId = 1
function nextSequenceId() {
  return sequenceId++
}

const itemToWorryLevelMap = new Map<number, number>()

class Monkey {
  id: number
  itemIds: number[]
  _operation: Function
  testDivisor: number
  trueRecipientId: number
  falseRecipientId: number
  inspectionCount: number

  constructor(id:number, worryLevels:number[], operation:Function, testDivisor:number, trueRecipientId:number, falseRecipientId:number) {
    this.id = id
    this.itemIds = worryLevels.map(worryLevel => {
      const itemId = nextSequenceId()
      itemToWorryLevelMap.set(itemId, worryLevel)
      return itemId
    })
    this._operation = operation
    this.testDivisor = testDivisor
    this.trueRecipientId = trueRecipientId
    this.falseRecipientId = falseRecipientId
    this.inspectionCount = 0
  }

  // The monkey inspects the item
  inspect(itemId:number): number {
    this.inspectionCount++

    const worryLevel = itemToWorryLevelMap.get(itemId!)
    const worryLevelAfterInspection = this._operation(worryLevel!)
    const worryLevelAfterRelief = Math.floor(worryLevelAfterInspection / RELIEF_FACTOR)

    // Update the worry level tracker
    itemToWorryLevelMap.set(itemId!, worryLevelAfterRelief)

    return worryLevelAfterRelief
  }

  // The monkey assesses your worry level about the item
  test(worryLevel:number): boolean {
    return worryLevel! % this.testDivisor === 0
  }

  pass(itemId:number, recipientId:number): void {
    // Pass the item to another monkey
    const recipientMonkey = monkeys.find(monkey => monkey.id === recipientId)
    recipientMonkey!.itemIds.push(itemId!)
  }

  takeTurn(): void {
    while (this.itemIds.length > 0) {
      // Get the first item
      const itemId = this.itemIds.shift()

      // Inspect it
      const adjustedWorryLevel = this.inspect(itemId!)

      // Test your adjusted worry level
      const testOutcome = this.test(adjustedWorryLevel!)

      // Pass the item to the correct recipient
      const recipientId = testOutcome ? this.trueRecipientId : this.falseRecipientId
      this.pass(itemId!, recipientId)
    }
  }
}

function runRound(): void {
  monkeys.forEach(monkey => monkey.takeTurn())
}

function getMostActiveMonkeys(count:number): Monkey[] {
  return _.chain(monkeys)
    .orderBy('inspectionCount', 'desc')
    .take(count)
    .value()
}

function parseMonkeyRules(monkeyRulesBlock:string[]): Monkey {
  const [
    monkeyIdLine,
    worryLevelsLine,
    operationLine,
    testDescriptionLine,
    trueRecipientLine,
    falseRecipientLine
  ] = monkeyRulesBlock

  const monkeyId = Number((monkeyIdLine.match(/\d+/) || [])[0])
  const worryLevels = (worryLevelsLine.match(/\d+/g) || []).map(Number)
  const operationBody = operationLine.replace(/^\s+Operation: new = /, '')
  const operation = new Function('old', `return ${operationBody}`)
  const testDivisor = Number((testDescriptionLine.match(/\d+/) || [])[0])
  const trueRecipientId = Number((trueRecipientLine.match(/\d+/) || [])[0])
  const falseRecipientId = Number((falseRecipientLine.match(/\d+/) || [])[0])
  return new Monkey(monkeyId, worryLevels, operation, testDivisor, trueRecipientId, falseRecipientId)
}

const sectionReader = await getInputSectionStream(getInputFileName())

// Assess each group of numbers
const monkeys:Monkey[] = []
for await (const monkeyRules:string[] of sectionReader) {
  // ⚠️ If there are a lot of lines, this could get slow as we already read them once creating the SectionReader
  monkeys.push(parseMonkeyRules(monkeyRules))
}
//console.debug(monkeys)

// Run the rounds
for (let i = 0; i < ROUND_COUNT; i++) {
  runRound()
}

//console.debug(monkeys.map(monkey => monkey.itemIds.map(itemId => itemToWorryLevelMap.get(itemId))))

const mostActiveMonkeys = getMostActiveMonkeys(2)
const monkeyBusiness = mostActiveMonkeys.reduce((acc:number, monkey:Monkey) => acc * monkey.inspectionCount, 1)


console.log(`[pt${PART_NUMBER}] Monkey business after ${ROUND_COUNT} rounds: ${monkeyBusiness}`)
