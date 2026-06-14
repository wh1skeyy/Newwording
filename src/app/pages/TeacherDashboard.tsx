import { useEffect, useState } from 'react'
import { supabase, getNextId } from '../../lib/supabase'
import { enrichWords } from '../../lib/gemini'
import { b1Words } from '../../lib/b1words'
import { showToast } from '../components/Toast'
import { IDBadge, TypeBadge } from '../components/Badge'
import { Skeleton, SkeletonTable } from '../components/Skeleton'
import type { Class, Student, Lesson, Word } from '../../lib/types'

const INPUT_STYLE: React.CSSProperties = {
  background: '#191c1e',
  border: '1px solid #464554',
  borderRadius: 4,
  padding: '10px 14px',
  color: '#e0e3e5',
  fontFamily: "'Be Vietnam Pro', sans-serif",
  fontSize: 14,
  width: '100%',
  outline: 'none',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#908fa0',
  display: 'block',
  marginBottom: 6,
}

const PRIMARY_BTN: React.CSSProperties = {
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
}

const SECONDARY_BTN: React.CSSProperties = {
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
  transition: 'all 200ms ease',
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        type={type}
        style={INPUT_STYLE}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
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
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <select
        style={{ ...INPUT_STYLE, cursor: 'pointer' }}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={e => {
          e.currentTarget.style.borderColor = '#8083ff'
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(128,131,255,0.20)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = '#464554'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <option value="" disabled>Select...</option>
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#191c1e' }}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function TeacherDashboard() {
  const [authed, setAuthed] = useState(() => localStorage.getItem('teacherAuth') === 'true')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<'students' | 'lessons' | 'create'>('students')

  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Students forms
  const [className, setClassName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [studentClassId, setStudentClassId] = useState('')

  // Create lesson
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonClassId, setLessonClassId] = useState('')
  const [wordCount, setWordCount] = useState(10)
  const [wordsText, setWordsText] = useState('')
  const [enrichedWords, setEnrichedWords] = useState<Word[]>([])
  const [editableWords, setEditableWords] = useState<Word[]>([])
  const [enriching, setEnriching] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (authed) loadData()
  }, [authed])

  async function loadData() {
    setLoading(true)
    try {
      const [{ data: classData }, { data: studentData }, { data: lessonData }] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('students').select('*').order('id'),
        supabase.from('lessons').select('*').order('created_at', { ascending: false }),
      ])
      setClasses(classData || [])
      setStudents(studentData || [])
      setLessons(lessonData || [])

      // Word counts
      const ids = (studentData || []).map((s: Student) => s.id)
      if (ids.length > 0) {
        const counts: Record<string, number> = {}
        await Promise.all(ids.map(async id => {
          const { count } = await supabase
            .from('master_words')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', id)
          counts[id] = count || 0
        }))
        setWordCounts(counts)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleLogin() {
    if (password === import.meta.env.VITE_TEACHER_PASSWORD) {
      localStorage.setItem('teacherAuth', 'true')
      setAuthed(true)
    } else {
      setAuthError('INCORRECT PASSWORD')
    }
  }

  async function handleAddClass() {
    if (!className.trim()) return
    const id = slugify(className)
    const { error } = await supabase.from('classes').insert({ id, name: className })
    if (!error) {
      showToast('CLASS ADDED', 'success')
      setClassName('')
      loadData()
    } else {
      showToast(`Error: ${error.message}`, 'error')
    }
  }

  async function handleAddStudent() {
    if (!studentName || !studentEmail || !studentClassId) return
    try {
      const id = await getNextId('students')
      const { error } = await supabase.from('students').insert({
        id,
        name: studentName,
        email: studentEmail,
        class_id: studentClassId,
      })
      if (!error) {
        showToast(`STUDENT ADDED — ID: ${id}`, 'success')
        setStudentName('')
        setStudentEmail('')
        setStudentClassId('')
        loadData()
      } else {
        showToast(`Error: ${error.message}`, 'error')
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  async function handleDeleteStudent(id: string) {
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (!error) {
      showToast('Student removed', 'info')
      loadData()
    } else {
      showToast(`Error: ${error.message}`, 'error')
    }
  }

  const wordLines = wordsText.split('\n').map(l => l.trim()).filter(Boolean)
  const wordCountMatch = wordLines.length === wordCount

  async function handleEnrich() {
    setEnriching(true)
    try {
      const result = await enrichWords(wordLines)
      setEnrichedWords(result)
      setEditableWords(result)
    } catch {
      showToast('Failed to enrich words. Please retry.', 'error')
    } finally {
      setEnriching(false)
    }
  }

  async function handlePublish() {
    if (!lessonTitle || !lessonClassId || editableWords.length === 0) return
    setPublishing(true)
    try {
      const b1WordPairs = editableWords.map(w => {
        const shuffled = [...b1Words].sort(() => Math.random() - 0.5)
        return { b1word1: shuffled[0], b1word2: shuffled[1], targetWord: w.word }
      })

      const id = await getNextId('lessons')
      const { error } = await supabase.from('lessons').insert({
        id,
        title: lessonTitle,
        class_id: lessonClassId,
        word_count: editableWords.length,
        words: editableWords,
        b1_word_pairs: b1WordPairs,
        sentences: null,
      })

      if (error) throw error

      const { data: classStudents } = await supabase
        .from('students')
        .select('id, name, email')
        .eq('class_id', lessonClassId)

      const appUrl = import.meta.env.VITE_APP_URL || ''
      await fetch('https://n8n.fonfoto.space/webhook/hw-send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: id,
          lessonTitle: lessonTitle,
          classId: lessonClassId,
          students: (classStudents || []).map((s: any) => ({
            name: s.name,
            email: s.email,
            studentId: s.id,
          })),
          directLink: `${appUrl}/?lesson=${id}`,
        }),
      }).catch(() => {})

      showToast(`LESSON ${id} PUBLISHED — STUDENTS NOTIFIED`, 'success')
      setLessonTitle('')
      setLessonClassId('')
      setWordCount(10)
      setWordsText('')
      setEnrichedWords([])
      setEditableWords([])
      setActiveTab('lessons')
      loadData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setPublishing(false)
    }
  }

  function updateWord(i: number, field: keyof Word, value: string) {
    setEditableWords(prev => prev.map((w, idx) => idx === i ? { ...w, [field]: value } : w))
  }

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()

  if (!authed) {
    return (
      <div className="animate-fade-in" style={{
        minHeight: '100vh',
        background: '#101415',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 360,
          background: '#1d2022',
          border: '1px solid #464554',
          borderRadius: 8,
          padding: 32,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: '#8083ff',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            TEACHER ACCESS
          </div>
          <InputField
            label="PASSWORD"
            type="password"
            value={password}
            onChange={setPassword}
          />
          {authError && (
            <div style={{
              marginTop: 12,
              background: 'rgba(255,180,171,0.12)',
              color: '#ffb4ab',
              border: '1px solid rgba(255,180,171,0.20)',
              borderRadius: 4,
              padding: '8px 12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {authError}
            </div>
          )}
          <button
            onClick={handleLogin}
            style={{ ...PRIMARY_BTN, width: '100%', marginTop: 16 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#c0c1ff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#8083ff' }}
          >
            ENTER →
          </button>
        </div>
      </div>
    )
  }

  const groupedStudents = classes.map(cls => ({
    cls,
    students: students.filter(s => s.class_id === cls.id),
  }))

  return (
    <div style={{ minHeight: '100vh', background: '#101415' }}>
      {/* Header */}
      <div style={{
        background: '#191c1e',
        borderBottom: '1px solid #464554',
        padding: '20px 64px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      className="teacher-header"
      >
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 500,
          color: '#c0c1ff',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          TEACHER DASHBOARD
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#908fa0',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {today}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #464554', display: 'flex', padding: '0 64px' }} className="teacher-tabs">
        {(['students', 'lessons', 'create'] as const).map(tab => (
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
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div key={activeTab} className="animate-slide-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 64px 64px' }}>

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }} className="students-grid">
            <div>
              {/* Add Class */}
              <div style={{
                background: '#1d2022',
                border: '1px solid #464554',
                borderRadius: 8,
                padding: 24,
                marginBottom: 16,
              }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#908fa0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                  ADD CLASS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InputField label="CLASS NAME" value={className} onChange={setClassName} />
                  <button
                    style={SECONDARY_BTN}
                    onClick={handleAddClass}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#8083ff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#464554' }}
                  >
                    ADD CLASS →
                  </button>
                </div>
              </div>

              {/* Add Student */}
              <div style={{
                background: '#1d2022',
                border: '1px solid #464554',
                borderRadius: 8,
                padding: 24,
              }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#908fa0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                  ADD STUDENT
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InputField label="NAME" value={studentName} onChange={setStudentName} />
                  <InputField label="EMAIL" value={studentEmail} onChange={setStudentEmail} type="email" />
                  <SelectField
                    label="CLASS"
                    value={studentClassId}
                    onChange={setStudentClassId}
                    options={classes.map(c => ({ value: c.id, label: c.name }))}
                  />
                  <button
                    style={PRIMARY_BTN}
                    onClick={handleAddStudent}
                    onMouseEnter={e => { e.currentTarget.style.background = '#c0c1ff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#8083ff' }}
                  >
                    ADD STUDENT →
                  </button>
                </div>
              </div>
            </div>

            <div>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={60} style={{ marginBottom: 12 }} />)
              ) : groupedStudents.map(({ cls, students: clsStudents }) => (
                <div key={cls.id} style={{ marginBottom: 24 }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: '#8083ff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #272a2c',
                    paddingBottom: 8,
                    marginBottom: 12,
                  }}>
                    {cls.name}
                  </div>
                  {clsStudents.length === 0 ? (
                    <div style={{ color: '#464554', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>NO STUDENTS</div>
                  ) : clsStudents.map(student => (
                    <div
                      key={student.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: '1px solid #272a2c',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <IDBadge id={student.id} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#e0e3e5' }}>{student.name}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#908fa0', marginTop: 2 }}>
                            {student.email}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#908fa0' }}>
                          {wordCounts[student.id] || 0} words
                        </span>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          style={{
                            background: 'transparent',
                            color: '#ffb4ab',
                            border: '1px solid #93000a',
                            borderRadius: 4,
                            padding: '4px 10px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,180,171,0.08)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LESSONS TAB */}
        {activeTab === 'lessons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={80} style={{ marginBottom: 8 }} />)
            ) : lessons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#464554' }}>NO LESSONS YET</div>
                <div style={{ color: '#908fa0', marginTop: 8, fontSize: 14 }}>Create your first lesson in the CREATE tab.</div>
              </div>
            ) : lessons.map(lesson => {
              const cls = classes.find(c => c.id === lesson.class_id)
              return (
                <div
                  key={lesson.id}
                  style={{
                    background: '#1d2022',
                    border: '1px solid #464554',
                    borderRadius: 8,
                    padding: 24,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
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
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: '#8083ff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      LESSON {lesson.id}
                    </div>
                    <div style={{ fontSize: 16, color: '#e0e3e5', marginTop: 4, fontWeight: 400 }}>{lesson.title}</div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: '#908fa0',
                      marginTop: 4,
                    }}>
                      {cls?.name || lesson.class_id} · {new Date(lesson.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{
                      background: 'rgba(192,193,255,0.10)',
                      color: '#c0c1ff',
                      border: '1px solid rgba(192,193,255,0.15)',
                      borderRadius: 4,
                      padding: '4px 10px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                    }}>
                      {lesson.word_count} WORDS
                    </span>
                    {cls && (
                      <span style={{
                        background: 'rgba(192,193,255,0.10)',
                        color: '#c0c1ff',
                        border: '1px solid rgba(192,193,255,0.15)',
                        borderRadius: 4,
                        padding: '4px 10px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                      }}>
                        {cls.name}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CREATE TAB */}
        {activeTab === 'create' && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{
              background: '#1d2022',
              border: '1px solid #464554',
              borderRadius: 8,
              padding: 32,
            }}>
              {/* Step 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <InputField label="LESSON TITLE" value={lessonTitle} onChange={setLessonTitle} />
                <SelectField
                  label="ASSIGN TO CLASS"
                  value={lessonClassId}
                  onChange={setLessonClassId}
                  options={classes.map(c => ({ value: c.id, label: c.name }))}
                />

                <div>
                  <label style={LABEL_STYLE}>WORD COUNT</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[10, 15, 20].map(n => (
                      <button
                        key={n}
                        onClick={() => setWordCount(n)}
                        style={{
                          ...( wordCount === n ? { background: '#8083ff', color: '#1000a9', border: 'none' } : { background: 'transparent', color: '#c0c1ff', border: '1px solid #464554' }),
                          borderRadius: 4,
                          padding: '10px 24px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          fontWeight: 500,
                          letterSpacing: '0.05em',
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              {lessonTitle && lessonClassId && (
                <div className="animate-fade-in" style={{ marginTop: 24 }}>
                  <label style={LABEL_STYLE}>ENTER {wordCount} WORDS — ONE PER LINE</label>
                  <textarea
                    rows={12}
                    value={wordsText}
                    onChange={e => {
                      setWordsText(e.target.value)
                      if (enrichedWords.length > 0) { setEnrichedWords([]); setEditableWords([]) }
                    }}
                    placeholder={'ambitious\ndeadline\nexhausted\n...'}
                    style={{
                      ...INPUT_STYLE,
                      resize: 'vertical',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
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
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: wordCountMatch ? '#4edea3' : '#908fa0',
                    marginTop: 8,
                    textAlign: 'right',
                  }}>
                    {wordLines.length} / {wordCount}
                  </div>

                  <button
                    onClick={handleEnrich}
                    disabled={!wordCountMatch || enriching}
                    style={{
                      ...PRIMARY_BTN,
                      width: '100%',
                      marginTop: 12,
                      opacity: wordCountMatch && !enriching ? 1 : 0.5,
                      cursor: wordCountMatch && !enriching ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {enriching ? 'GENERATING...' : 'GENERATE WITH AI →'}
                  </button>

                  {enriching && (
                    <div style={{ marginTop: 16 }}>
                      <SkeletonTable rows={5} />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 — Review */}
              {editableWords.length > 0 && !enriching && (
                <div className="animate-fade-in" style={{ marginTop: 24 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#191c1e' }}>
                          {['WORD', 'VIETNAMESE', 'TYPE', 'EXAMPLE'].map(h => (
                            <th key={h} style={{
                              padding: '14px 16px',
                              textAlign: 'left',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              color: '#908fa0',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              whiteSpace: 'nowrap',
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {editableWords.map((word, i) => (
                          <tr key={word.word} style={{
                            borderTop: '1px solid #272a2c',
                            borderLeft: '2px solid rgba(128,131,255,0.25)',
                          }}>
                            <td style={{ padding: '12px 16px', color: '#c0c1ff', fontSize: 14, fontWeight: 600 }}>
                              {word.word}
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <input
                                style={{ ...INPUT_STYLE, padding: '6px 10px', fontSize: 13 }}
                                value={word.vietnamese}
                                onChange={e => updateWord(i, 'vietnamese', e.target.value)}
                                onFocus={e => {
                                  e.currentTarget.style.borderColor = '#8083ff'
                                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(128,131,255,0.20)'
                                }}
                                onBlur={e => {
                                  e.currentTarget.style.borderColor = '#464554'
                                  e.currentTarget.style.boxShadow = 'none'
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <select
                                style={{ ...INPUT_STYLE, padding: '6px 10px', fontSize: 13, width: 'auto' }}
                                value={word.type}
                                onChange={e => updateWord(i, 'type', e.target.value)}
                                onFocus={e => {
                                  e.currentTarget.style.borderColor = '#8083ff'
                                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(128,131,255,0.20)'
                                }}
                                onBlur={e => {
                                  e.currentTarget.style.borderColor = '#464554'
                                  e.currentTarget.style.boxShadow = 'none'
                                }}
                              >
                                {['n', 'v', 'adj', 'adv', 'phr v', 'phrase', 'idiom'].map(t => (
                                  <option key={t} value={t} style={{ background: '#191c1e' }}>{t}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <textarea
                                rows={2}
                                style={{ ...INPUT_STYLE, padding: '6px 10px', fontSize: 13, resize: 'none' }}
                                value={word.example}
                                onChange={e => updateWord(i, 'example', e.target.value)}
                                onFocus={e => {
                                  e.currentTarget.style.borderColor = '#8083ff'
                                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(128,131,255,0.20)'
                                }}
                                onBlur={e => {
                                  e.currentTarget.style.borderColor = '#464554'
                                  e.currentTarget.style.boxShadow = 'none'
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Step 4 — Publish */}
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    style={{
                      marginTop: 24,
                      width: '100%',
                      background: publishing ? '#272a2c' : '#006c49',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '14px 24px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      cursor: publishing ? 'not-allowed' : 'pointer',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {publishing ? 'PUBLISHING...' : 'PUBLISH LESSON →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .teacher-header, .teacher-tabs { padding: 12px 16px !important; }
          .students-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
