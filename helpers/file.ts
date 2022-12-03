import * as path from 'https://deno.land/std/path/mod.ts'
import { TextLineStream } from 'https://deno.land/std/streams/text_line_stream.ts'
import { DelimiterStream } from 'https://deno.land/std/streams/delimiter_stream.ts'

export async function getInputStream(relativePath:string): Promise<ReadableStream<Uint8Array>> {
  // Figure out the file path relative to the main executing script file
  const mainModuleDir = path.dirname(path.fromFileUrl(Deno.mainModule))
  const inputFilePath = path.resolve(mainModuleDir, relativePath)

  // Try opening the input file; if it fails, let the error propagate
  const inputFile = await Deno.open(inputFilePath, { read: true })

  // Build a readable stream so the file doesn't have to be fully loaded into
  // memory while we send it
  return inputFile.readable
}

export async function getInputLineStream(relativePath:string): Promise<ReadableStream<string>> {
  const inputReader = await getInputStream(relativePath)
  return inputReader!
    .pipeThrough(new TextDecoderStream()) // convert Uint8Array to string
    .pipeThrough(new TextLineStream()) // transform into a stream where each chunk is divided by a newline
}

export async function getInputRowStream(relativePath:string, options?: { delimiter?:string|RegExp, includeEmptyRows?:boolean }): Promise<ReadableStream<string[]>> {
  const splitDelimiter = options?.delimiter ?? /\s+/
  const omitEmptyRows = options?.includeEmptyRows !== true
  const lineReader = await getInputLineStream(relativePath)
  return lineReader!
    .pipeThrough(new TransformStream({
      transform: (row:string, controller) => {
        const trimmedRow = row.trim()

        // Omit empty rows?
        const isEmptyRow = trimmedRow === ''
        if (omitEmptyRows && isEmptyRow) return

        const cells = isEmptyRow ? [] : trimmedRow.split(splitDelimiter)
        controller.enqueue(cells)
      }
    }))
}

export async function getInputSectionStream(relativePath:string): Promise<ReadableStream<string[]>> {
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
