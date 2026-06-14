import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '/utils/supabase/info'

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export async function getNextId(key: 'students' | 'lessons'): Promise<string> {
  const { data, error } = await supabase.rpc('increment_counter', { counter_key: key })
  if (error) throw error
  return String(data).padStart(4, '0')
}
