import { useState } from 'react'
import type { Word, B1Pair } from '../../../lib/types'

export interface SentenceMakingResult {
  targetWord: string
  b1word1: string
  b1word2: string
  studentSentence: string
}

interface Props {
  words: Word[]
  b1Pairs: B1Pair[]
  onComplete: (results: SentenceMakingResult[]) => void
}

export default function SentenceMakingExercise({ words, b1Pairs, onComplete }: Props) {
  const [sentences, setSentences] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    setSubmitted(true)
    const results: SentenceMakingResult[] = words.map((word, i) => ({
      targetWord: word.word,
      b1word1: b1Pairs[i]?.b1word1 || '',
      b1word2: b1Pairs[i]?.b1word2 || '',
      studentSentence: sentences[i] || '',
    }))
    onComplete(results)
  }

  return (
    <div>
      <div
        style={{
          background: '#191c1e',
          border: '1px solid #464554',
          borderRadius: 8,
          padding: '14px 20px',
          marginBottom: 20,
        }}
      >
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#908fa0',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          USE ALL THREE WORDS IN ONE SENTENCE
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {words.map((word, i) => {
          const pair = b1Pairs[i]
          return (
            <div
              key={word.word}
              style={{
                background: '#1d2022',
                border: '1px solid #464554',
                borderRadius: 8,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: '#464554',
                  minWidth: 24,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Chip color="default">{pair?.b1word1 || '—'}</Chip>
                <span style={{ color: '#464554' }}>+</span>
                <Chip color="default">{pair?.b1word2 || '—'}</Chip>
                <span style={{ color: '#464554' }}>+</span>
                <Chip color="primary">{word.word}</Chip>
              </div>
              <textarea
                rows={2}
                disabled={submitted}
                placeholder="Write your sentence here..."
                value={sentences[i] || ''}
                onChange={e => setSentences(prev => ({ ...prev, [i]: e.target.value }))}
                style={{
                  background: '#191c1e',
                  border: '1px solid #464554',
                  borderRadius: 4,
                  padding: '10px 14px',
                  color: '#e0e3e5',
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 14,
                  width: '100%',
                  outline: 'none',
                  resize: 'vertical',
                  marginTop: 10,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#8083ff'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(128,131,255,0.20)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#464554'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
          )
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          style={{
            marginTop: 24,
            width: '100%',
            background: '#8083ff',
            color: '#1000a9',
            border: 'none',
            borderRadius: 4,
            padding: '12px 24px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#c0c1ff'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.10)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#8083ff'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          SUBMIT ALL →
        </button>
      ) : (
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
            fontSize: 12,
            color: '#4edea3',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          SUBMITTED — YOUR TEACHER WILL REVIEW
        </div>
      )}
    </div>
  )
}

function Chip({ children, color }: { children: React.ReactNode; color: 'default' | 'primary' }) {
  return (
    <span style={{
      background: color === 'primary' ? 'rgba(128,131,255,0.12)' : '#272a2c',
      color: color === 'primary' ? '#c0c1ff' : '#e0e3e5',
      border: `1px solid ${color === 'primary' ? 'rgba(128,131,255,0.25)' : '#464554'}`,
      borderRadius: 4,
      padding: '4px 10px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      fontWeight: 500,
    }}>
      {children}
    </span>
  )
}
