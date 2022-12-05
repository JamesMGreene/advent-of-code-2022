#!/usr/bin/env -S deno run --allow-read

import { getInputText } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'

interface IStep {
  quantity: number,
  from: number,
  to: number
}

//
// Processing functions
//
function parseStep(step:string) : IStep {
  const [quantity, from, to] = step.match(/\d+/g)!.map(Number)
  return { quantity, from, to }
}

const inputData = await getInputText(getInputFileName())
const [drawing, procedure] = inputData.split('\n\n')

const drawingLines = drawing.split('\n')

const stackNumberLine = drawingLines.pop()
const stackCount = Number(stackNumberLine!.match(/\d+\s*$/)!.pop())

const stacksSingle:string[][] = Array(stackCount).fill(0).map(_ => [])
const stacksMulti:string[][] = Array(stackCount)
for (const drawingLine of drawingLines) {
  //console.debug(drawingLine)
  for (let i = 0; i < stackCount; i++) {
    // 0 => 1, 1 => 5, 2 => 9
    const crateLetter = drawingLine.charAt((4*i) + 1)
    //console.debug(i, crateLetter)
    if (crateLetter !== ' ') {
      stacksSingle[i].unshift(crateLetter)
    }
  }
}

// Copy the stacks over
stacksSingle.forEach((stack, i) => stacksMulti[i] = stack.slice())

//console.debug(JSON.stringify(stacksSingle))
//console.debug(JSON.stringify(stacksMulti))

const procedureSteps = procedure.split('\n')
const parsedSteps = procedureSteps.filter(Boolean).map(parseStep)
//console.debug(JSON.stringify(stepsData, null, 2))

for (const { quantity, from, to } of parsedSteps) {
  for (let i = 0; i < quantity; i++) {
    const crateLetter = stacksSingle[from - 1].pop()
    stacksSingle[to - 1].push(crateLetter!)
  }

  const crateLetters = stacksMulti[from - 1].splice(-quantity)
  stacksMulti[to - 1].push(...crateLetters)
}

//console.debug(JSON.stringify(stacksSingle))
//console.debug(JSON.stringify(stacksMulti))

console.log('[pt1] Single-move top crates: ' + stacksSingle.map(stack => stack[stack.length - 1]).join(''))
console.log('[pt2] Multi-move top crates: ' + stacksMulti.map(stack => stack[stack.length - 1]).join(''))
