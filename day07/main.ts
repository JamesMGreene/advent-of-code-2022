import { getInputSectionStream } from '../helpers/file.ts'
import { getInputFileName } from '../helpers/args.ts'
import * as path from 'https://deno.land/std/path/mod.ts'
import { _ } from '../helpers/lodash.ts'

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
interface IFile {
  name: string,
  path: string,
  parentDir: IDirectory,
  size: number
}
interface IDirectory {
  name: string,
  path: string,
  parentDir: IDirectory|null,
  files: IFile[],
  directories: IDirectory[],
  cumulativeSize: number
}
const fsMap:IDirectory = {
  name: '/',
  path: '/',
  parentDir: null,
  files: [],
  directories: [],
  cumulativeSize: 0
}
let currentPath = fsMap.path
let currentDir:IDirectory = fsMap

// Assess each group of numbers
for await (const lines of commandReader) {
  // ⚠️ If there are a lot of lines, this could get slow as we already read them once creating the SectionReader
  const [command, ...output] = lines
  if (!command) {
    continue
  }
  console.debug(command)

  if (command.startsWith('cd ')) {
    const nextPath = command.slice(3)

    if (nextPath === '/') {
      currentDir = fsMap
      currentPath = currentDir.path
      continue
    }
    else if (nextPath === '..') {
      currentDir = currentDir.parentDir ?? fsMap
      currentPath = currentDir.path
      continue
    } else {
      let nextDir:IDirectory|undefined = currentDir.directories.find(dir => dir.name === nextPath)
      if (!nextDir) {
        nextDir = {
          name: nextPath,
          path: path.resolve(currentPath, nextPath),
          parentDir: currentDir,
          files: [],
          directories: [],
          cumulativeSize: 0
        }
        currentDir.directories.push(nextDir)
      }
      currentDir = nextDir
      currentPath = currentDir.path
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
        let dir:IDirectory|undefined = currentDir.directories.find(dir => dir.name === name)
        if (!dir) {
          dir = {
            name: name,
            path: path.resolve(currentPath, name),
            parentDir: currentDir,
            files: [],
            directories: [],
            cumulativeSize: 0
          }
          currentDir.directories.push(dir)
        }
      } else {
        let file:IFile|undefined = currentDir.files.find(file => file.name === name)
        if (!file) {
          file = {
            name,
            path: path.resolve(currentPath, name),
            parentDir: currentDir,
            size: Number(firstPart)
          }
          currentDir.files.push(file)
        }
      }
    }
  }
}

console.debug(JSON.stringify(fsMap, ['name', 'path', 'size', 'directories', 'files'], 2))

const relevantDirs:IDirectory[] = []
const allDirs:IDirectory[] = []

function calculateCumulativeSizes(dir:IDirectory): number {
  let totalSize = 0
  for (const file of dir.files) {
    totalSize += file.size
  }
  for (const subDir of dir.directories) {
    totalSize += calculateCumulativeSizes(subDir)
  }
  dir.cumulativeSize = totalSize

  if (dir.cumulativeSize <= 100000) {
    relevantDirs.push(dir)
  }

  if (dir.path !== '/') {
    allDirs.push(dir)
  }

  return totalSize
}

const fsSize = calculateCumulativeSizes(fsMap)

console.debug(JSON.stringify(fsMap, ['name', 'path', 'size', 'directories', 'files', 'cumulativeSize'], 2))
console.debug('Total fs size: ' + fsSize)

const cumulativeSizeSumOfRelevantDirs = _.sumBy(relevantDirs, 'cumulativeSize')

const currentUsedDiskSpace = fsMap.cumulativeSize
const bigEnoughDirs = allDirs.filter(dir => (currentUsedDiskSpace - dir.cumulativeSize) <= MAX_USED_DISK_SPACE)
const bigEnoughDirsSortedAscBySize:IDirectory[] = _.sortBy(bigEnoughDirs, 'cumulativeSize')
const dirToDelete = bigEnoughDirsSortedAscBySize[0]

console.log('[pt1] Sum: ' + cumulativeSizeSumOfRelevantDirs)
console.log('[pt2] Best dir to delete (' + dirToDelete.path + '), size: ' + dirToDelete.cumulativeSize)
