import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import { getSRStatus, srStatusSortOrder, type SRRecord } from '../../lib/spaced-repetition'
import { SRBadge, TypeBadge } from '../components/Badge'
import { SkeletonCard } from '../components/Skeleton'
import type { Student, Lesson, MasterWord, Class } from '../../lib/types'

const BTN = {
  primary: {
    background: '#8083ff',
    color: '#1000a9',
    border: 'none',
    borderRadius: 4,
    padding: '10px 20px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  secondary: {
    background: 'transparent',
    color: '#c0c1ff',
    border: '1px solid #464554',
    borderRadius: 4,
    padding: '10px 20px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
}

export default function StudentDashboard() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'lessons' | 'wordbank'>('lessons')
  const [student, setStudent] = useState<Student | null>(null)
  const [classInfo, setClassInfo] = useState<Class | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [srRecords, setSrRecords] = useState<SRRecord[]>([])
  const [masterWords, setMasterWords] = useState<MasterWord[]>([])
  const [wordSearch, setWordSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return
    loadData()
  }, [studentId])

  async function loadData() {
    setLoading(true)
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()
      setStudent(studentData)

      if (studentData?.class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('*')
          .eq('id', studentData.class_id)
          .single()
        setClassInfo(classData)

        const { data: lessonData } = await supabase
          .from('lessons')
          .select('*')
          .eq('class_id', studentData.class_id)
          .order('created_at', { ascending: false })
        setLessons(lessonData || [])
      }

      const { data: srData } = await supabase
        .from('spaced_repetition')
        .select('*')
        .eq('student_id', studentId)
      setSrRecords(srData || [])

      const { data: wordData } = await supabase
        .from('master_words')
        .select('*')
        .eq('student_id', studentId)
        .order('added_at', { ascending: false })
      setMasterWords(wordData || [])
    } finally {
      setLoading(false)
    }
  }

  function getSRForLesson(lessonId: string) {
    return srRecords.find(r => r.lesson_id === lessonId) || null
  }

  const sortedLessons = [...lessons].sort((a, b) => {
    const aStatus = getSRStatus(getSRForLesson(a.id))
    const bStatus = getSRStatus(getSRForLesson(b.id))
    return srStatusSortOrder(aStatus.type) - srStatusSortOrder(bStatus.type)
  })

  const filteredWords = masterWords.filter(w =>
    w.word.toLowerCase().includes(wordSearch.toLowerCase()) ||
    w.vietnamese.toLowerCase().includes(wordSearch.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#101415' }}>
      {/* Header */}
      <div
        style={{
          background: '#191c1e',
          borderBottom: '1px solid #464554',
          padding: '20px 64px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        className="responsive-header"
      >
        <div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#e0e3e5', lineHeight: 1.2 }}>
            {loading ? '...' : student?.name}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: '#908fa0',
            marginTop: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {classInfo?.name || '—'}
          </div>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 500,
          color: '#4edea3',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {masterWords.length} WORDS LEARNED
        </div>
      </div>

      {/* Body */}
      <div
        style={{ maxWidth: 1200, margin: '0 auto', padding: '0 64px' }}
        className="responsive-body"
      >
        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #464554', display: 'flex', marginTop: 32 }}>
          {(['lessons', 'wordbank'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #8083ff' : '2px solid transparent',
                color: activeTab === tab ? '#c0c1ff' : '#908fa0',
                cursor: 'pointer',
                transition: 'color 200ms ease',
                marginBottom: -1,
              }}
            >
              {tab === 'lessons' ? 'MY LESSONS' : 'WORD BANK'}
            </button>
          ))}
        </div>

        <div className="animate-slide-in" key={activeTab} style={{ paddingTop: 24, paddingBottom: 40 }}>
          {activeTab === 'lessons' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              ) : sortedLessons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#464554' }}>NO LESSONS YET</div>
                  <div style={{ color: '#908fa0', marginTop: 8, fontSize: 14 }}>Your teacher hasn't assigned any lessons.</div>
                </div>
              ) : (
                sortedLessons.map(lesson => {
                  const sr = getSRForLesson(lesson.id)
                  const status = getSRStatus(sr)
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => navigate(`/lesson/${lesson.id}?student=${studentId}`)}
                      style={{
                        background: '#1d2022',
                        border: '1px solid #464554',
                        borderRadius: 8,
                        padding: 24,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 200ms ease, box-shadow 200ms ease',
                        gap: 16,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#8083ff'
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.10)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#464554'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div>
                        <SRBadge type={status.type} label={status.label} />
                        <div style={{ fontSize: 16, color: '#e0e3e5', marginTop: 6, fontWeight: 400 }}>
                          {lesson.title}
                        </div>
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          color: '#908fa0',
                          marginTop: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          LESSON {lesson.id} · {lesson.word_count} WORDS
                        </div>
                      </div>
                      <div onClick={e => e.stopPropagation()}>
                        {(status.type === 'overdue' || status.type === 'due-today') && (
                          <button
                            style={BTN.primary}
                            onClick={() => navigate(`/lesson/${lesson.id}?student=${studentId}`)}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#c0c1ff'
                              e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.10)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#8083ff'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                          >
                            REVIEW NOW →
                          </button>
                        )}
                        {status.type === 'not-started' && (
                          <button
                            style={BTN.secondary}
                            onClick={() => navigate(`/lesson/${lesson.id}?student=${studentId}`)}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = '#8083ff'
                              e.currentTarget.style.color = '#c0c1ff'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = '#464554'
                              e.currentTarget.style.color = '#c0c1ff'
                            }}
                          >
                            START →
                          </button>
                        )}
                        {status.type === 'upcoming' && (
                          <div style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: '#c0c1ff',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            {status.label}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}

              {/* Random Practice */}
              {!loading && masterWords.length >= 10 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{
                    borderTop: '1px solid #272a2c',
                    paddingTop: 24,
                    marginBottom: 16,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: '#908fa0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    PRACTICE
                  </div>
                  <div
                    style={{
                      background: '#1d2022',
                      border: '1px solid #464554',
                      borderRadius: 8,
                      padding: 24,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ color: '#e0e3e5', fontSize: 14 }}>Drill from your full word bank</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        style={BTN.secondary}
                        onClick={() => navigate(`/practice/${studentId}?count=10`)}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#8083ff' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#464554' }}
                      >
                        PRACTICE 10
                      </button>
                      {masterWords.length >= 20 && (
                        <button
                          style={BTN.secondary}
                          onClick={() => navigate(`/practice/${studentId}?count=20`)}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#8083ff' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#464554' }}
                        >
                          PRACTICE 20
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wordbank' && (
            <div>
              <input
                style={{
                  background: '#191c1e',
                  border: '1px solid #464554',
                  borderRadius: 4,
                  padding: '10px 14px',
                  color: '#e0e3e5',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  letterSpacing: '0.05em',
                  width: '100%',
                  outline: 'none',
                  marginBottom: 20,
                  textTransform: 'uppercase',
                }}
                placeholder="SEARCH WORDS..."
                value={wordSearch}
                onChange={e => setWordSearch(e.target.value)}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#8083ff'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(128,131,255,0.20)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#464554'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />

              {loading ? (
                <div>Loading...</div>
              ) : filteredWords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#464554' }}>NO WORDS YET</div>
                  <div style={{ color: '#908fa0', marginTop: 8, fontSize: 14 }}>Complete your first lesson to build your word bank.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                    <thead>
                      <tr style={{ background: '#191c1e' }}>
                        {['WORD', 'VIETNAMESE', 'TYPE', 'EXAMPLE'].map(h => (
                          <th
                            key={h}
                            style={{
                              padding: '14px 16px',
                              textAlign: 'left',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 12,
                              fontWeight: 500,
                              color: '#908fa0',
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWords.map((word, i) => (
                        <tr
                          key={word.id || i}
                          style={{ borderTop: '1px solid #272a2c', transition: 'background 150ms' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#272a2c' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <td style={{ padding: '14px 16px', color: '#c0c1ff', fontSize: 14, fontWeight: 600 }}>
                            {word.word}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#e0e3e5', fontSize: 14 }}>
                            {word.vietnamese}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <TypeBadge type={word.type} />
                          </td>
                          <td style={{ padding: '14px 16px', color: '#908fa0', fontSize: 14, fontStyle: 'italic' }}>
                            {word.example}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .responsive-header { padding: 16px !important; }
          .responsive-body { padding: 0 16px !important; }
        }
      `}</style>
    </div>
  )
}
