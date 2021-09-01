export function calculateK(n: number): number {
  return n - Math.round(Math.sqrt(1.1 * n) - 1)
}
