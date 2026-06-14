import { useState, useEffect } from 'react'
import type { Word } from '../../../lib/types'

interface Props {
  words: Word[]
  onComplete: () => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function MatchingExercise({ words, onComplete }: Props) {
  const [leftItems, setLeftItems] = useState<string[]>([])
  const [rightItems, setRightItems] = useState<string[]>([])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    setLeftItems(shuffle(words.map(w => w.word)))
    setRightItems(shuffle(words.map(w => w.vietnamese)))
  }, [words])

  useEffect(() => {
    if (selectedLeft && selectedRight) {
      const correctWord = words.find(w => w.word === selectedLeft)
      if (correctWord?.vietnamese === selectedRight) {
        const next = new Set(matched)
        next.add(selectedLeft)
        setMatched(next)
        setSelectedLeft(null)
        setSelectedRight(null)
        if (next.size === words.length) {
          setCompleted(true)
          onComplete()
        }
      } else {
        setWrong(new Set([selectedLeft, selectedRight]))
        setTimeout(() => {
          setWrong(new Set())
          setSelectedLeft(null)
          setSelectedRight(null)
        }, 400)
      }
    }
  }, [selectedLeft, selectedRight])

  function cardStyle(id: string, side: 'left' | 'right'): React.CSSProperties {
    const word = side === 'left' ? id : words.find(w => w.vietnamese === id)?.word
    const isMatched = word ? matched.has(word) : false
    const isSelected = side === 'left' ? selectedLeft === id : selectedRight === id
    const isWrong = wrong.has(id)

    return {
      background: isMatched
        ? 'rgba(78,222,163,0.08)'
        : isWrong
        ? 'rgba(255,180,171,0.08)'
        : isSelected
        ? 'rgba(128,131,255,0.08)'
        : '#191c1e',
      border: `1px solid ${
        isMatched ? 'rgba(78,222,163,0.40)'
        : isWrong ? 'rgba(255,180,171,0.40)'
        : isSelected ? '#8083ff'
        : '#464554'
      }`,
      borderRadius: 8,
      padding: '14px 16px',
      cursor: isMatched ? 'default' : 'pointer',
      transition: 'all 150ms ease',
      pointerEvents: isMatched ? 'none' : 'auto',
      color: isMatched ? '#4edea3' : '#e0e3e5',
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    }
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}
      className="matching-grid"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leftItems.map(word => (
            <div
              key={word}
              style={cardStyle(word, 'left')}
              onClick={() => { if (!matched.has(word)) setSelectedLeft(word) }}
            >
              <span style={{ fontWeight: 600, color: matched.has(word) ? '#4edea3' : '#c0c1ff' }}>
                {word}
              </span>
              {matched.has(word) && <span style={{ color: '#4edea3' }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rightItems.map(meaning => {
            const word = words.find(w => w.vietnamese === meaning)?.word || ''
            const isMatched = matched.has(word)
            return (
              <div
                key={meaning}
                style={cardStyle(meaning, 'right')}
                onClick={() => { if (!isMatched) setSelectedRight(meaning) }}
              >
                <span>{meaning}</span>
                {isMatched && <span style={{ color: '#4edea3' }}>✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      {completed && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: 24,
            background: 'rgba(78,222,163,0.10)',
            border: '1px solid rgba(78,222,163,0.20)',
            borderRadius: 8,
            padding: '16px 24px',
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: '#4edea3',
            letterSpacing: '0.05em',
          }}
        >
          ALL MATCHED ✓
        </div>
      )}

    </div>
  )
}
