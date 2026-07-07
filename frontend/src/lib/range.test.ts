import { test, expect } from 'bun:test'
import { RANGES, RANGE_DAYS, rangeStart } from './range'

const DAY = 86_400_000
const NOW = new Date('2026-07-05T00:00:00Z')

test('RANGES en orden esperado', () => {
  expect(RANGES).toEqual(['1D', '1S', '1M', '3M', '6M', '1A', '3A', 'Todo'])
})

test('rangeStart resta los días correctos', () => {
  expect(rangeStart('1D', NOW)).toBe(NOW.getTime() - 1 * DAY)
  expect(rangeStart('1S', NOW)).toBe(NOW.getTime() - 7 * DAY)
  expect(rangeStart('1A', NOW)).toBe(NOW.getTime() - RANGE_DAYS['1A'] * DAY)
})

test('rangeStart("Todo") es -Infinity', () => {
  expect(rangeStart('Todo', NOW)).toBe(-Infinity)
})
