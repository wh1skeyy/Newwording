import type { SRStatus } from '../../lib/spaced-repetition'

const badgeStyles: Record<SRStatus['type'], React.CSSProperties> = {
  overdue: {
    background: 'rgba(255,180,171,0.12)',
    color: '#ffb4ab',
    border: '1px solid rgba(255,180,171,0.20)',
  },
  'due-today': {
    background: 'rgba(232,200,77,0.12)',
    color: '#e8c84d',
    border: '1px solid rgba(232,200,77,0.20)',
  },
  upcoming: {
    background: 'rgba(192,193,255,0.10)',
    color: '#c0c1ff',
    border: '1px solid rgba(192,193,255,0.15)',
  },
  completed: {
    background: 'rgba(78,222,163,0.12)',
    color: '#4edea3',
    border: '1px solid rgba(78,222,163,0.20)',
  },
  'not-started': {
    background: 'transparent',
    color: '#908fa0',
    border: '1px solid #464554',
  },
}

interface SRBadgeProps {
  type: SRStatus['type']
  label: string
}

export function SRBadge({ type, label }: SRBadgeProps) {
  return (
    <span
      style={{
        ...badgeStyles[type],
        borderRadius: 4,
        padding: '4px 10px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      style={{
        background: 'rgba(192,193,255,0.10)',
        color: '#c0c1ff',
        border: '1px solid rgba(192,193,255,0.15)',
        borderRadius: 4,
        padding: '4px 10px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        display: 'inline-block',
      }}
    >
      {type}
    </span>
  )
}

export function IDBadge({ id }: { id: string }) {
  return (
    <span
      style={{
        background: 'rgba(192,193,255,0.10)',
        color: '#c0c1ff',
        border: '1px solid rgba(192,193,255,0.15)',
        borderRadius: 4,
        padding: '3px 8px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        display: 'inline-block',
      }}
    >
      {id}
    </span>
  )
}
