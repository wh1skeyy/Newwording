import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { supabase } from '../../lib/supabase'
import { Skeleton } from '../components/Skeleton'
import LessonPage from './LessonPage'
import type { MasterWord } from '../../lib/types'

export default function PracticePage() {
  const { studentId } = useParams<{ studentId: string }>()
  const [searchParams] = useSearchParams()
  const count = parseInt(searchParams.get('count') || '10', 10)

  const [words, setWords] = useState<MasterWord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return
    loadWords()
  }, [studentId, count])

  async function loadWords() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('master_words')
        .select('*')
        .eq('student_id', studentId)
        .limit(count * 5) // fetch more, shuffle, take count

      const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, count)
      setWords(shuffled)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#101415' }}>
        <div className="responsive-header" style={{ background: '#191c1e', borderBottom: '1px solid #464554', padding: '16px 64px', display: 'flex', gap: 24 }}>
          <Skeleton width={80} height={32} />
          <Skeleton width={200} height={24} />
        </div>
        <div className="px-mobile-16" style={{ maxWidth: 800, margin: '40px auto', padding: '0 64px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={80} />)}
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#101415', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#908fa0', fontFamily: "'JetBrains Mono', monospace" }}>NO WORDS AVAILABLE</div>
      </div>
    )
  }

  return (
    <LessonPage
      isPractice
      practiceStudentId={studentId}
      practiceWords={words}
      practiceCount={count}
    />
  )
}
