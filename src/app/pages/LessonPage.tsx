import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import { generateReviewDates } from '../../lib/spaced-repetition'
import { generateSentences } from '../../lib/gemini'
import type { SentenceItem } from '../../lib/types'
import { showToast } from '../components/Toast'
import MatchingExercise from '../components/exercises/MatchingExercise'
import SentencesExercise from '../components/exercises/SentencesExercise'
import SentenceMakingExercise from '../components/exercises/SentenceMakingExercise'
import HangmanExercise from '../components/exercises/HangmanExercise'
import { Skeleton } from '../components/Skeleton'
import type { Lesson } from '../../lib/types'

const TABS = ['MATCHING', 'SENTENCES', 'MAKE', 'HANGMAN']

interface Props {
  isPractice?: boolean
  practiceStudentId?: string
  practiceWords?: any[]
  practiceCount?: number
}

export default function LessonPage({ isPractice, practiceStudentId, practiceWords, practiceCount }: Props) {
  const { lessonId } = useParams<{ lessonId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const studentId = practiceStudentId || searchParams.get('student') || ''
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [sentences, setSentences] = useState<SentenceItem[] | null>(null)
  const [sentencesLoading, setSentencesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [completed, setCompleted] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (isPractice && practiceWords) {
      const fakelesson = {
        id: 'practice',
        title: 'Practice Session',
        class_id: '',
        word_count: practiceWords.length,
        words: practiceWords,
        b1_word_pairs: practiceWords.map((_w: any, _i: number) => ({
          b1word1: 'ability',
          b1word2: 'achieve',
          targetWord: _w.word,
        })),
        sentences: null,
        created_at: new Date().toISOString(),
      } as Lesson
      setLesson(fakelesson)
      setLoading(false)
      loadPracticeSentences(practiceWords)
    } else if (lessonId) {
      loadLesson()
    }
  }, [lessonId, isPractice, practiceWords])

  async function loadPracticeSentences(words: any[]) {
    setSentencesLoading(true)
    try {
      const result = await generateSentences(words)
      setSentences(result)
    } catch {
      showToast('Failed to generate sentences', 'error')
    } finally {
      setSentencesLoading(false)
    }
  }

  async function loadLesson() {
    setLoading(true)
    try {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (!lessonData) return
      setLesson(lessonData)

      // Handle SR record
      if (studentId) {
        const today = new Date().toISOString().split('T')[0]
        const { data: sr } = await supabase
          .from('spaced_repetition')
          .select('*')
          .eq('student_id', studentId)
          .eq('lesson_id', lessonId)
          .single()

        if (!sr) {
          await supabase.from('spaced_repetition').insert({
            student_id: studentId,
            lesson_id: lessonId,
            added_date: today,
            review_dates: generateReviewDates(new Date()),
            completed_reviews: [],
          })
        } else {
          const overdueDates = sr.review_dates.filter(
            (d: string) => d <= today && !sr.completed_reviews.includes(d)
          )
          if (overdueDates.length > 0) {
            await supabase.from('spaced_repetition').update({
              completed_reviews: [...sr.completed_reviews, ...overdueDates],
            }).eq('id', sr.id)
          }
        }

        // Upsert words into master_words
        const upserts = lessonData.words.map((w: any) => ({
          student_id: studentId,
          word: w.word,
          vietnamese: w.vietnamese,
          type: w.type,
          example: w.example,
        }))
        await supabase.from('master_words').upsert(upserts, {
          onConflict: 'student_id,word',
          ignoreDuplicates: true,
        })
      }

      // Handle sentences
      if (lessonData.sentences) {
        const allWords = lessonData.words.map((w: any) => w.word)
        const withOptions = lessonData.sentences.map((s: any) => ({
          ...s,
          options: [...allWords].sort(() => Math.random() - 0.5),
        }))
        setSentences(withOptions)
      } else {
        setSentencesLoading(true)
        try {
          const result = await generateSentences(lessonData.words)
          setSentences(result)
          await supabase.from('lessons').update({
            sentences: result.map(({ sentence, answer }) => ({ sentence, answer })),
          }).eq('id', lessonId)
        } catch {
          showToast('Failed to generate sentences. Tap to retry.', 'error')
        } finally {
          setSentencesLoading(false)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function markComplete(tabIdx: number) {
    setCompleted(prev => new Set([...prev, tabIdx]))
  }

  const backPath = isPractice
    ? `/student/${practiceStudentId}`
    : `/student/${studentId}`

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#101415' }}>
        <div className="responsive-header" style={{ background: '#191c1e', borderBottom: '1px solid #464554', padding: '16px 64px', display: 'flex', gap: 24 }}>
          <Skeleton width={80} height={32} />
          <Skeleton width={200} height={24} />
        </div>
        <div className="px-mobile-16" style={{ maxWidth: 800, margin: '40px auto', padding: '0 64px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={80} />
          ))}
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div style={{ minHeight: '100vh', background: '#101415', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#908fa0', fontFamily: "'JetBrains Mono', monospace" }}>LESSON NOT FOUND</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#101415' }}>
      {/* Header */}
      <div style={{
        background: '#191c1e',
        borderBottom: '1px solid #464554',
        padding: '16px 64px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}
      className="lesson-header"
      >
        <button
          onClick={() => navigate(backPath)}
          style={{
            background: 'transparent',
            color: '#c0c1ff',
            border: '1px solid #464554',
            borderRadius: 4,
            padding: '8px 16px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ← BACK
        </button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#e0e3e5' }}>
            {isPractice ? 'PRACTICE SESSION' : lesson.title}
          </div>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#908fa0',
          whiteSpace: 'nowrap',
        }}>
          {lesson.word_count} WORDS
          {isPractice && ` FROM YOUR BANK`}
        </div>
      </div>

      {/* Progress pills */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        padding: '16px 64px',
        flexWrap: 'wrap',
      }}
      className="px-mobile-16"
      >
        {TABS.map((tab, i) => (
          <div
            key={tab}
            style={{
              background: completed.has(i) ? 'rgba(78,222,163,0.12)' : '#272a2c',
              color: completed.has(i) ? '#4edea3' : '#908fa0',
              border: `1px solid ${completed.has(i) ? 'rgba(78,222,163,0.20)' : '#464554'}`,
              borderRadius: 4,
              padding: '6px 14px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            0{i + 1} {tab}
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div className="lesson-tabs" style={{ borderBottom: '1px solid #464554', display: 'flex', justifyContent: 'center', padding: '0 64px' }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '12px 20px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === i ? '2px solid #8083ff' : '2px solid transparent',
              color: activeTab === i ? '#c0c1ff' : '#908fa0',
              cursor: 'pointer',
              transition: 'color 200ms ease',
              marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        key={activeTab}
        className="animate-slide-in lesson-content"
        style={{ maxWidth: 800, margin: '0 auto', padding: '32px 64px 64px' }}
      >
        {activeTab === 0 && (
          <MatchingExercise
            words={lesson.words}
            onComplete={() => markComplete(0)}
          />
        )}
        {activeTab === 1 && (
          <SentencesExercise
            sentences={sentences}
            loading={sentencesLoading}
            onComplete={() => markComplete(1)}
          />
        )}
        {activeTab === 2 && (
          <SentenceMakingExercise
            words={lesson.words}
            b1Pairs={lesson.b1_word_pairs || []}
            onComplete={() => markComplete(2)}
          />
        )}
        {activeTab === 3 && (
          <HangmanExercise
            words={lesson.words}
            onComplete={() => markComplete(3)}
          />
        )}
      </div>

    </div>
  )
}
