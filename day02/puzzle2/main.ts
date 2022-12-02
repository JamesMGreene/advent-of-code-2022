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
let myScore = 0

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const rowReader = await getInputRowStream()

// Assess each group of numbers
for await (const [oppChoice, outcomeChoice] of rowReader) {
  const oppShape = SHAPES[oppChoice]
  const outcome = OUTCOMES[outcomeChoice]

  // Draw? Lose? Win?
  const myShape = determineShapeForOutcome(oppShape, outcome)
  myScore += calculateRoundScore(myShape, outcome)
}

console.log('My score: ' + myScore)
