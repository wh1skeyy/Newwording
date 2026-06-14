import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '/utils/supabase/info'

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

// Generates a random 4-char uppercase alphanumeric ID, e.g. "A3F9"
function randomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1 to avoid confusion
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function generateStudentId(): Promise<string> {
  // Retry until we get one that doesn't already exist
  for (let i = 0; i < 10; i++) {
    const id = randomId()
    const { data } = await supabase.from('students').select('id').eq('id', id).maybeSingle()
    if (!data) return id
  }
  throw new Error('Could not generate a unique student ID after 10 attempts')
}

export async function getNextId(key: 'lessons'): Promise<string> {
  const { data, error } = await supabase.rpc('increment_counter', { counter_key: key })
  if (error) throw error
  return String(data).padStart(4, '0')
}
