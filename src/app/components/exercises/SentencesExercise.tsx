import { useState } from 'react'
import type { SentenceItem } from '../../../lib/types'
import { Skeleton } from '../Skeleton'

interface Props {
  sentences: SentenceItem[] | null
  loading: boolean
  onComplete: () => void
}

export default function SentencesExercise({ sentences, loading, onComplete }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  function handleSelect(idx: number, word: string) {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [idx]: word }))
  }

  function handleSubmit() {
    if (!sentences) return
    let correct = 0
    sentences.forEach((s, i) => {
      if (answers[i] === s.answer) correct++
    })
    setScore(correct)
    setSubmitted(true)
    if (correct / sentences.length >= 0.7) onComplete()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ background: '#1d2022', border: '1px solid #464554', borderRadius: 8, padding: 24 }}>
            <Skeleton height={20} width="80%" />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} width={80} height={32} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!sentences || sentences.length === 0) {
    return <div style={{ color: '#908fa0', textAlign: 'center', padding: 40 }}>No sentences available.</div>
  }

  const allAnswered = sentences.every((_, i) => answers[i] !== undefined)

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sentences.map((item, i) => {
          const userAnswer = answers[i]
          const isCorrect = submitted && userAnswer === item.answer
          const isWrong = submitted && userAnswer !== undefined && userAnswer !== item.answer

          const parts = item.sentence.split('______')
          return (
            <div
              key={i}
              className="animate-slide-in"
              style={{
                background: '#1d2022',
                border: '1px solid #464554',
                borderRadius: 8,
                padding: 24,
                marginBottom: 0,
              }}
            >
              <div style={{ fontSize: 16, color: '#e0e3e5', lineHeight: 1.6, marginBottom: 16 }}>
                {parts[0]}
                <span style={{
                  borderBottom: '2px solid #8083ff',
                  minWidth: 80,
                  display: 'inline-block',
                  textAlign: 'center',
                  marginLeft: 4,
                  marginRight: 4,
                  color: isCorrect ? '#4edea3' : isWrong ? '#ffb4ab' : '#c0c1ff',
                  fontWeight: 600,
                }}>
                  {userAnswer || '      '}
                </span>
                {parts[1]}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {item.options.map(opt => {
                  const isSelected = userAnswer === opt
                  const showCorrect = submitted && opt === item.answer
                  const showWrong = submitted && isSelected && opt !== item.answer
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(i, opt)}
                      disabled={submitted}
                      style={{
                        background: showCorrect
                          ? 'rgba(78,222,163,0.12)'
                          : showWrong
                          ? 'rgba(255,180,171,0.12)'
                          : isSelected
                          ? '#1d2022'
                          : '#272a2c',
                        border: `1px solid ${
                          showCorrect ? 'rgba(78,222,163,0.20)'
                          : showWrong ? 'rgba(255,180,171,0.20)'
                          : isSelected ? '#8083ff'
                          : '#464554'
                        }`,
                        borderRadius: 4,
                        padding: '6px 12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        color: showCorrect ? '#4edea3' : showWrong ? '#ffb4ab' : isSelected ? '#c0c1ff' : '#908fa0',
                        cursor: submitted ? 'default' : 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          style={{
            marginTop: 24,
            width: '100%',
            background: allAnswered ? '#8083ff' : '#272a2c',
            color: allAnswered ? '#1000a9' : '#464554',
            border: 'none',
            borderRadius: 4,
            padding: '12px 24px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: allAnswered ? 'pointer' : 'not-allowed',
            transition: 'all 200ms ease',
          }}
        >
          SUBMIT →
        </button>
      ) : (
        <div
          className="animate-fade-in"
          style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 600,
            color: score / sentences.length >= 0.7 ? '#4edea3' : '#ffb4ab',
          }}
        >
          {score} / {sentences.length} CORRECT
          {score / sentences.length < 0.7 && (
            <div style={{ fontSize: 13, color: '#908fa0', marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400 }}>
              Need 70% to complete this exercise
            </div>
          )}
        </div>
      )}
    </div>
  )
}
