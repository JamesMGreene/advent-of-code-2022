import * as path from 'https://deno.land/std/path/mod.ts'
import { TextLineStream } from 'https://deno.land/std/streams/text_line_stream.ts'
import { DelimiterStream } from 'https://deno.land/std/streams/delimiter_stream.ts'

const DEFAULT_INPUT_FILE_PATH = '../input.txt'

export async function readRelativeFile(relativePath: string): Promise<ReadableStream<Uint8Array>> {
  // Figure out the file path relative to the main executing script file
  const mainModuleDir = path.dirname(path.fromFileUrl(Deno.mainModule))
  const inputFilePath = path.resolve(mainModuleDir, relativePath)

  // Try opening the input file; if it fails, let the error propagate
  const inputFile = await Deno.open(inputFilePath, { read: true })

  // Build a readable stream so the file doesn't have to be fully loaded into
  // memory while we send it
  return inputFile.readable
}

export function getInputStream(relativePath = DEFAULT_INPUT_FILE_PATH): Promise<ReadableStream<Uint8Array>> {
  return readRelativeFile(relativePath)
}

export async function getInputLineStream(relativePath?: string): Promise<ReadableStream<string>> {
  const inputReader = await getInputStream(relativePath)
  return inputReader!
    .pipeThrough(new TextDecoderStream()) // convert Uint8Array to string
    .pipeThrough(new TextLineStream()) // transform into a stream where each chunk is divided by a newline
}

export async function getInputCellStream(relativePath?: string): Promise<ReadableStream<string[]>> {
  const lineReader = await getInputLineStream(relativePath)
  return lineReader!
    .pipeThrough(new TransformStream({
      // ⚠️ This transformation has potential performance issues as it buffers "cells" into memory for each line
      transform: (line:string, controller) => {
        const trimmedLine = line.trim()
        if (trimmedLine !== '') {
          const cells = trimmedLine.split(/\s+/)
          controller.enqueue(cells)
        }
      }
    }))
}

export async function getInputSectionStream(relativePath?: string): Promise<ReadableStream<string[]>> {
  const inputStream = await getInputStream(relativePath)
  return inputStream!
    .pipeThrough(new DelimiterStream(new TextEncoder().encode('\n\n'))) // transform into a stream where each chunk is divided by two newlines
    .pipeThrough(new TextDecoderStream()) // convert Uint8Array to string
    .pipeThrough(new TransformStream({
      // ⚠️ This transformation has potential performance issues as it buffers lines into memory for each section
      transform: (section:string, controller) => {
        const lines = section.split('\n')
        controller.enqueue(lines)
      }
    }))
}