import type { SRRecord } from './types'

export type { SRRecord }

export interface SRStatus {
  type: 'not-started' | 'overdue' | 'due-today' | 'upcoming' | 'completed'
  label: string
}

const INTERVALS = [1, 3, 7, 14, 30, 60, 120]

export function generateReviewDates(fromDate: Date): string[] {
  return INTERVALS.map(d => {
    const date = new Date(fromDate)
    date.setDate(date.getDate() + d)
    return date.toISOString().split('T')[0]
  })
}

export function getSRStatus(record: SRRecord | null): SRStatus {
  if (!record) return { type: 'not-started', label: 'NOT STARTED' }
  const today = new Date().toISOString().split('T')[0]
  const pending = record.review_dates.filter(
    d => !record.completed_reviews.includes(d)
  )
  if (pending.length === 0) return { type: 'completed', label: 'COMPLETED' }
  const next = pending[0]
  if (next < today) return { type: 'overdue', label: 'OVERDUE' }
  if (next === today) return { type: 'due-today', label: 'DUE TODAY' }
  return { type: 'upcoming', label: `NEXT: ${next}` }
}

export function srStatusSortOrder(type: SRStatus['type']): number {
  const order: Record<SRStatus['type'], number> = {
    overdue: 0,
    'due-today': 1,
    upcoming: 2,
    'not-started': 3,
    completed: 4,
  }
  return order[type]
}
