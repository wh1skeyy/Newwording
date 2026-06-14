export interface Word {
  word: string
  vietnamese: string
  type: string
  example: string
}

export interface B1Pair {
  b1word1: string
  b1word2: string
  targetWord: string
}

export interface Class {
  id: string
  name: string
  created_at: string
}

export interface Student {
  id: string
  name: string
  email: string
  class_id: string
  created_at: string
}

export interface SentenceItem {
  sentence: string
  answer: string
  options: string[]
}

export interface Lesson {
  id: string
  title: string
  class_id: string
  word_count: number
  words: Word[]
  b1_word_pairs: B1Pair[]
  sentences: SentenceItem[] | null
  created_at: string
}

export interface MasterWord extends Word {
  id: string
  student_id: string
  added_at: string
}

export interface SRRecord {
  id: string
  student_id: string
  lesson_id: string
  added_date: string
  review_dates: string[]
  completed_reviews: string[]
}
