import { getInputSectionStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'
import * as path from 'https://deno.land/std/path/mod.ts'

// Constants
const TOTAL_DISK_SPACE = 70000000
const REQUIRED_FREE_DISK_SPACE = 30000000
const MAX_USED_DISK_SPACE = TOTAL_DISK_SPACE - REQUIRED_FREE_DISK_SPACE

//
// Prepare the processing functions
//

// Get a readable stream from the input file doesn't have to be fully loaded into memory
const commandReader = await getInputSectionStream(getInputFileName(), { sectionDelimiter: '$ ', lineDelimiter: '\n' })

// Filesystem mapping
interface INode {
  type: string,
  name: string,
  path: string,
  parentNode: IDirectory|null,
  size: number
}
interface IDirectory extends INode {
  childNodes: Map<string, INode>
}

class File implements INode {
  // INode properties
  type: string
  name: string
  path: string
  parentNode: Directory
  size: number

  constructor(name:string, parentNode:Directory, size:number) {
    this.type = 'file'
    this.name = name
    this.path = path.resolve(parentNode.path, name)
    this.parentNode = parentNode
    this.size = size
  }
}

class Directory implements IDirectory {
  // INode properties
  type: string
  name: string
  path: string
  parentNode: Directory|null
  size: number

  // IDirectory properties
  childNodes: Map<string, INode>

  constructor(name:string, parentNode:Directory|null) {
    this.type = 'directory'
    this.name = name
    this.path = parentNode ? path.resolve(parentNode.path, name) : name
    this.parentNode = parentNode
    this.size = 0
    this.childNodes = new Map()
  }

  addChildNode(node:INode): void {
    const oldNode = this.childNodes.get(node.name)
    const oldSize = oldNode?.size ?? 0

    // Add or overwrite the node
    this.childNodes.set(node.name, node)

    // Update cumulative sizes of all ancestral directories when adding a new file
    if (node.type === 'file') {
      updateCumulativeSizes(this, node.size - oldSize)
    }
  }
}

// NOTE: Intentionally causing side effects throughout ancestral directories!
function updateCumulativeSizes(dir:IDirectory, sizeOfAddedFile:number): void {
  dir.size += sizeOfAddedFile
  if (!dir.parentNode) return
  // Tail recursion
  return updateCumulativeSizes(dir.parentNode!, sizeOfAddedFile)
}

function part1Reducer(acc:number, currentNode:INode):number {
  if (currentNode.type === 'directory') {
    const currentDir = currentNode as IDirectory
    if (currentDir.size <= 100000) {
      acc += currentNode.size
    }
    // Recurse
    for (const [, childNode] of currentDir.childNodes[Symbol.iterator]()) {
      acc += part1Reducer(0, childNode)
    }
  }
  return acc
}

function part2Reducer(dirToDelete:IDirectory|null, currentNode:INode, minimumSize:number):IDirectory|null {
  if (currentNode.type === 'directory') {
    const currentDir = currentNode as IDirectory
    if (
      // Cannot delete the root directory
      !!currentNode.parentNode &&
      // Must be at least the minimum size worthy of deletion
      currentDir.size >= minimumSize &&
      // Must be smaller than the current smallest directory worthy of deletion
      (!dirToDelete || currentDir.size < dirToDelete.size) 
    ) {
      dirToDelete = currentDir
    }

    // Recurse
    for (const [, childNode] of currentDir.childNodes[Symbol.iterator]()) {
      dirToDelete = part2Reducer(dirToDelete, childNode, minimumSize)
    }
  }
  return dirToDelete
}

const fsMap = new Directory('/', null)
let currentDir:Directory = fsMap

// Assess each group of numbers
for await (const lines of commandReader) {
  // ⚠️ If there are a lot of lines, this could get slow as we already read them once creating the SectionReader
  const [command, ...output] = lines
  if (!command) {
    continue
  }

  if (command.startsWith('cd ')) {
    const nextPath = command.slice(3)

    if (nextPath === '/') {
      currentDir = fsMap
      continue
    }
    else if (nextPath === '..') {
      currentDir = currentDir.parentNode ?? fsMap
      continue
    }
    else {
      let nextDir:INode|undefined = currentDir.childNodes.get(nextPath)
      if (nextDir && nextDir.type !== 'directory') {
        throw new Error(`Path ${nextPath} is not a directory!`)
      }
      if (!nextDir) {
        nextDir = new Directory(nextPath, currentDir)
        currentDir.addChildNode(nextDir)
      }
      currentDir = nextDir as Directory
      continue
    }
  }

  else if (command === 'ls') {
    for (const line of output) {
      if (!line) {
        continue
      }

      const [firstPart, name] = line.split(' ')
      if (firstPart === 'dir') {
        let dir:INode|undefined = currentDir.childNodes.get(name)
        if (dir && dir.type !== 'directory') {
          throw new Error(`Path ${name} is not a directory!`)
        }
        if (!dir) {
          dir = new Directory(name, currentDir)
          currentDir.addChildNode(dir)
        }
      } else {
        let file:INode|undefined = currentDir.childNodes.get(name)
        if (file && file.type !== 'file') {
          throw new Error(`Path ${name} is not a file!`)
        }
        if (!file) {
          const size = Number(firstPart)
          file = new File(name, currentDir, size)
          currentDir.addChildNode(file)
        }
      }
    }
  }
}

//console.debug(JSON.stringify(fsMap, ['type', 'name', 'path', 'size', 'childNodes'], 2))

const currentUsedDiskSpace = fsMap.size
//console.debug('Total fs size: ' + currentUsedDiskSpace)

const aggregateSizeOfRelevantDirs = part1Reducer(0, fsMap)

const minimumDirSizeToDelete = currentUsedDiskSpace - MAX_USED_DISK_SPACE
const dirToDelete = part2Reducer(null, fsMap, minimumDirSizeToDelete)

console.log('[pt1] Aggregate size: ' + aggregateSizeOfRelevantDirs)
console.log('[pt2] Best dir to delete (' + dirToDelete!.path + '), size: ' + dirToDelete!.size)
