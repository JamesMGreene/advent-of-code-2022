#!/usr/bin/env -S deno run --allow-read

import { getInputRowStream } from '../../helpers/file.ts'

interface IMap<T> {
  [index: string]: T;
}

const SHAPES:IMap<string> = {
  A: 'rock',
  B: 'paper',
  C: 'scissors'
}

const SHAPE_VALUES:IMap<number> = {
  rock: 1,
  paper: 2,
  scissors: 3
}

const OUTCOMES:IMap<string> = {
  X: 'lose',
  Y: 'draw',
  Z: 'win'
}

const OUTCOME_VALUES:IMap<number> = {
  win: 6,
  draw: 3,
  lose: 0
}

// Prepare the processing functions

function doesFirstShapeWin(firstShape:string, secondShape:string) {
  return (
    (firstShape === 'rock' && secondShape === 'scissors') ||
    (firstShape === 'paper' && secondShape === 'rock') ||
    (firstShape === 'scissors' && secondShape === 'paper')
  )
}

function determineShapeForOutcome(firstShape:string, outcome:string) {
  if (outcome === 'win') {
    if (firstShape === 'rock') return 'paper'
    return firstShape === 'paper' ? 'scissors' : 'rock'
  }
  if (outcome === 'lose') {
    if (firstShape === 'rock') return 'scissors'
    return firstShape === 'paper' ? 'rock' : 'paper'
  }
  // Draw
  return firstShape
}

function calculateRoundScore(shape:string, outcome:string) {
  return SHAPE_VALUES[shape] + OUTCOME_VALUES[outcome]
}

// Keep track of my score
let myScorePt1 = 0
let myScorePt2 = 0

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const rowReader = await getInputRowStream()

// Assess each group of numbers
for await (const [oppChoice, secondCode] of rowReader) {
  const oppShape = SHAPES[oppChoice]

  // Part 1
  const myShapePt1 = SHAPES[secondCode]

  // Draw?
  if (oppShape === myShapePt1) {
    myScorePt1 += calculateRoundScore(myShapePt1, 'draw')
  }
  // Lose?
  else if (doesFirstShapeWin(oppShape, myShapePt1)) {
    myScorePt1 += calculateRoundScore(myShapePt1, 'lose')
  }
  // Win?
  else {
    myScorePt1 += calculateRoundScore(myShapePt1, 'win')
  }

  // Part 2
  const outcome = OUTCOMES[secondCode]

  // Draw? Lose? Win?
  const myShapePt2 = determineShapeForOutcome(oppShape, outcome)
  myScorePt2 += calculateRoundScore(myShapePt2, outcome)
}

console.log('[pt1] My score: ' + myScorePt1)
console.log('[pt2] My score: ' + myScorePt2)
