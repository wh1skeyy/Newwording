import { useState, useEffect } from 'react'
import type { Word } from '../../../lib/types'

interface Props {
  words: Word[]
  onComplete: () => void
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function HangmanSVG({ wrong }: { wrong: number }) {
  return (
    <svg width="160" height="200" viewBox="0 0 160 200" style={{ display: 'block', margin: '0 auto' }}>
      {/* Gallows */}
      <line x1="20" y1="190" x2="140" y2="190" stroke="#8083ff" strokeWidth="2" strokeLinecap="round" />
      <line x1="60" y1="190" x2="60" y2="20" stroke="#8083ff" strokeWidth="2" strokeLinecap="round" />
      <line x1="60" y1="20" x2="100" y2="20" stroke="#8083ff" strokeWidth="2" strokeLinecap="round" />
      <line x1="100" y1="20" x2="100" y2="40" stroke="#8083ff" strokeWidth="2" strokeLinecap="round" />
      {/* Head */}
      {wrong >= 1 && <circle cx="100" cy="55" r="15" stroke="#8083ff" strokeWidth="2" fill="none" />}
      {/* Body */}
      {wrong >= 2 && <line x1="100" y1="70" x2="100" y2="120" stroke="#8083ff" strokeWidth="2" strokeLinecap="round" />}
      {/* Left arm */}
      {wrong >= 3 && <line x1="100" y1="80" x2="75" y2="100" stroke="#8083ff" strokeWidth="2" strokeLinecap="round" />}
      {/* Right arm */}
      {wrong >= 4 && <line x1="100" y1="80" x2="125" y2="100" stroke="#8083ff" strokeWidth="2" strokeLinecap="round" />}
      {/* Left leg */}
      {wrong >= 5 && <line x1="100" y1="120" x2="75" y2="150" stroke="#8083ff" strokeWidth="2" strokeLinecap="round" />}
      {/* Right leg */}
      {wrong >= 6 && <line x1="100" y1="120" x2="125" y2="150" stroke="#8083ff" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  )
}

export default function HangmanExercise({ words, onComplete }: Props) {
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [guessed, setGuessed] = useState<Set<string>>(new Set())
  const [gameOver, setGameOver] = useState<'win' | 'lose' | null>(null)
  const [wonWords, setWonWords] = useState<Set<string>>(new Set())

  useEffect(() => {
    pickWord()
  }, [words])

  function pickWord() {
    const word = words[Math.floor(Math.random() * words.length)]
    setCurrentWord(word)
    setGuessed(new Set())
    setGameOver(null)
  }

  if (!currentWord) return null

  const wordLetters = currentWord.word.toUpperCase().split('')
  const wrongGuesses = [...guessed].filter(l => !wordLetters.includes(l))
  const wrongCount = wrongGuesses.length

  function handleGuess(letter: string) {
    if (guessed.has(letter) || gameOver) return
    const next = new Set(guessed)
    next.add(letter)
    setGuessed(next)

    const newWrong = [...next].filter(l => !wordLetters.includes(l))
    if (newWrong.length >= 6) {
      setGameOver('lose')
    } else if (wordLetters.every(l => l === ' ' || next.has(l))) {
      setGameOver('win')
      const newWon = new Set(wonWords)
      newWon.add(currentWord.word)
      setWonWords(newWon)
      if (newWon.size >= Math.ceil(words.length * 0.75)) {
        onComplete()
      }
    }
  }

  const exampleWithBlank = currentWord.example.replace(
    new RegExp(`\\b${currentWord.word}\\b`, 'gi'),
    '______'
  )

  return (
    <div>
      {/* Clue card */}
      <div style={{
        background: '#191c1e',
        border: '1px solid #464554',
        borderRadius: 8,
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#8083ff',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 6,
        }}>
          [{currentWord.type}]
        </div>
        <div style={{ fontSize: 16, color: '#e0e3e5', marginBottom: 6 }}>
          {currentWord.vietnamese}
        </div>
        <div style={{ fontSize: 14, color: '#908fa0', fontStyle: 'italic' }}>
          {exampleWithBlank}
        </div>
      </div>

      <HangmanSVG wrong={wrongCount} />

      {/* Word display */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 4,
        marginTop: 24,
        flexWrap: 'wrap',
      }}>
        {currentWord.word.split('').map((char, i) => (
          <span key={i}>
            {char === ' ' ? (
              <span style={{ width: 16, display: 'inline-block' }} />
            ) : (
              <span style={{
                display: 'inline-block',
                width: 32,
                textAlign: 'center',
                borderBottom: '2px solid #464554',
                marginLeft: 4,
                marginRight: 4,
                fontSize: 24,
                fontWeight: 600,
                color: '#c0c1ff',
                lineHeight: 1.2,
                paddingBottom: 4,
              }}>
                {guessed.has(char.toUpperCase()) ? char.toUpperCase() : ''}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Wrong counter */}
      {!gameOver && (
        <div style={{
          textAlign: 'center',
          marginTop: 16,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#ffb4ab',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {wrongCount} / 6 WRONG
        </div>
      )}

      {/* Alphabet grid */}
      {!gameOver && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 8,
          marginTop: 24,
          maxWidth: 320,
          margin: '24px auto 0',
        }}>
          {ALPHABET.map(letter => {
            const isGuessed = guessed.has(letter)
            const isCorrect = isGuessed && wordLetters.includes(letter)
            const isWrong = isGuessed && !wordLetters.includes(letter)
            return (
              <button
                key={letter}
                disabled={isGuessed}
                onClick={() => handleGuess(letter)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: isCorrect
                    ? 'rgba(78,222,163,0.12)'
                    : isWrong
                    ? 'rgba(255,180,171,0.08)'
                    : 'transparent',
                  color: isCorrect ? '#4edea3' : isWrong ? '#ffb4ab' : '#c0c1ff',
                  border: `1px solid ${
                    isCorrect ? 'rgba(78,222,163,0.20)'
                    : isWrong ? 'rgba(255,180,171,0.20)'
                    : '#464554'
                  }`,
                  borderRadius: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: isGuessed ? 'default' : 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {letter}
              </button>
            )
          })}
        </div>
      )}

      {/* Win/Lose state */}
      {gameOver === 'win' && (
        <div className="animate-fade-in" style={{ marginTop: 24 }}>
          <div style={{
            background: 'rgba(78,222,163,0.10)',
            border: '1px solid rgba(78,222,163,0.20)',
            borderRadius: 8,
            padding: '16px 24px',
            textAlign: 'center',
            color: '#4edea3',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            marginBottom: 12,
          }}>
            YOU GOT IT! ✓
            <div style={{ fontSize: 11, marginTop: 4 }}>
              PROGRESS: {wonWords.size} / {Math.ceil(words.length * 0.75)} REQUIRED
            </div>
          </div>
          <WordDefinitionCard word={currentWord} />
          <button
            onClick={pickWord}
            style={{
              marginTop: 16,
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
              width: '100%',
            }}
          >
            CONTINUE →
          </button>
        </div>
      )}

      {gameOver === 'lose' && (
        <div className="animate-fade-in" style={{ marginTop: 24 }}>
          <div style={{
            background: 'rgba(255,180,171,0.12)',
            border: '1px solid rgba(255,180,171,0.20)',
            borderRadius: 8,
            padding: '16px 24px',
            textAlign: 'center',
            color: '#ffb4ab',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            marginBottom: 12,
          }}>
            THE WORD WAS: {currentWord.word.toUpperCase()}
          </div>
          <WordDefinitionCard word={currentWord} />
          <button
            onClick={pickWord}
            style={{
              marginTop: 16,
              background: 'transparent',
              color: '#c0c1ff',
              border: '1px solid #464554',
              borderRadius: 4,
              padding: '12px 24px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            CONTINUE →
          </button>
        </div>
      )}
    </div>
  )
}

function WordDefinitionCard({ word }: { word: Word }) {
  return (
    <div style={{
      background: '#1d2022',
      border: '1px solid #464554',
      borderRadius: 8,
      padding: 20,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ color: '#c0c1ff', fontSize: 18, fontWeight: 600 }}>{word.word}</span>
        <span style={{
          background: 'rgba(192,193,255,0.10)',
          color: '#c0c1ff',
          border: '1px solid rgba(192,193,255,0.15)',
          borderRadius: 4,
          padding: '2px 8px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          textTransform: 'uppercase',
        }}>{word.type}</span>
      </div>
      <div style={{ color: '#e0e3e5', fontSize: 14, marginBottom: 6 }}>{word.vietnamese}</div>
      <div style={{ color: '#908fa0', fontSize: 13, fontStyle: 'italic' }}>{word.example}</div>
    </div>
  )
}
