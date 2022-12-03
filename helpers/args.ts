export function getInputFileName(): string {
  const useSampleData = ['-s', '--sample'].includes(Deno.args[0])
  return useSampleData ? 'sample.txt' : 'input.txt'
}
