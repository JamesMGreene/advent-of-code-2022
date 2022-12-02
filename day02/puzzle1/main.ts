#!/usr/bin/env -S deno run --allow-read

import { getInputRowStream } from '../../helpers/file.ts'

interface IMap<T> {
  [index: string]: T;
}

const SHAPES:IMap<string> = {
  A: 'rock',
  B: 'paper',
  C: 'scissors',
  X: 'rock',
  Y: 'paper',
  Z: 'scissors'
}

const SHAPE_VALUES:IMap<number> = {
  rock: 1,
  paper: 2,
  scissors: 3
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

function calculateRoundScore(shape:string, outcome:string) {
  return SHAPE_VALUES[shape] + OUTCOME_VALUES[outcome]
}


// Keep track of my score
let myScore = 0

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const rowReader = await getInputRowStream()

for await (const [oppChoice, myChoice] of rowReader) {
  const oppShape = SHAPES[oppChoice]
  const myShape = SHAPES[myChoice]

  // Draw?
  if (oppShape === myShape) {
    myScore += calculateRoundScore(myShape, 'draw')
  }
  // Lose?
  else if (doesFirstShapeWin(oppShape, myShape)) {
    myScore += calculateRoundScore(myShape, 'lose')
  }
  // Win?
  else {
    myScore += calculateRoundScore(myShape, 'win')
  }
}

console.log('My score: ' + myScore)
