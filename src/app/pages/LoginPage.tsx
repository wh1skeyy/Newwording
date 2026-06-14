import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'

const styles = {
  input: {
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
  } as React.CSSProperties,
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    color: '#908fa0',
    display: 'block',
    marginBottom: 6,
  } as React.CSSProperties,
  primaryBtn: {
    background: '#8083ff',
    color: '#1000a9',
    border: 'none',
    borderRadius: 4,
    padding: '12px 24px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    width: '100%',
    transition: 'all 200ms ease',
  } as React.CSSProperties,
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [studentId, setStudentId] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEnter() {
    setError('')
    if (!studentId.trim()) {
      setError('STUDENT ID REQUIRED')
      return
    }
    setLoading(true)
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId.trim())
        .single()

      if (!student) {
        setError('STUDENT NOT FOUND')
        setLoading(false)
        return
      }

      if (lessonId.trim()) {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('id', lessonId.trim())
          .single()

        if (!lesson) {
          setError('LESSON NOT FOUND')
          setLoading(false)
          return
        }
        navigate(`/lesson/${lessonId.trim()}?student=${studentId.trim()}`)
      } else {
        navigate(`/student/${studentId.trim()}`)
      }
    } catch {
      setError('CONNECTION ERROR')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleEnter()
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100vh',
        background: '#101415',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Invisible teacher entry */}
      <div
        onClick={() => navigate('/teacher')}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 40,
          height: 40,
          zIndex: 9999,
          background: 'transparent',
          border: 'none',
          cursor: 'default',
          outline: 'none',
        }}
        tabIndex={-1}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#1d2022',
          border: '1px solid #464554',
          borderRadius: 8,
          padding: 32,
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#8083ff',
              marginBottom: 8,
            }}
          >
            Vocabulary Lab
          </div>
          <div
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 24,
              fontWeight: 600,
              color: '#e0e3e5',
              lineHeight: 1.2,
            }}
          >
            Hello there, got some homework?
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={styles.label}>Student ID</label>
            <input
              style={styles.input}
              placeholder="0001"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              onKeyDown={handleKeyDown}
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

          <div>
            <label style={styles.label}>Lesson ID</label>
            <input
              style={{ ...styles.input, '::placeholder': { color: '#464554' } } as React.CSSProperties}
              placeholder="OPTIONAL"
              value={lessonId}
              onChange={e => setLessonId(e.target.value)}
              onKeyDown={handleKeyDown}
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

          {error && (
            <div
              style={{
                background: 'rgba(255,180,171,0.12)',
                color: '#ffb4ab',
                border: '1px solid rgba(255,180,171,0.20)',
                borderRadius: 4,
                padding: '8px 12px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {error}
            </div>
          )}

          <button
            style={{
              ...styles.primaryBtn,
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleEnter}
            disabled={loading}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.background = '#c0c1ff'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.10)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#8083ff'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {loading ? 'CHECKING...' : 'ENTER →'}
          </button>
        </div>

        <div
          style={{
            marginTop: 24,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#908fa0',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Contact your teacher for your Student ID
        </div>
      </div>
    </div>
  )
}
