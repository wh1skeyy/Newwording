import type { Word, SentenceItem } from './types'

export type { SentenceItem }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  })
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

export async function enrichWords(words: string[]): Promise<Word[]> {
  try {
    const prompt = `You are an English vocabulary expert for Vietnamese learners.
Given this list of English words, return a JSON array where each item has:
- "word": the original English word (string)
- "vietnamese": the most common Vietnamese translation (string)
- "type": the grammatical type — use only: "n", "v", "adj", "adv", "phr v", "phrase" (string)
- "example": one natural example sentence using the word at B1/B2 level (string)

Return ONLY a valid JSON array. No explanation, no markdown, no code blocks.

Words: ${words.join(', ')}`

    const text = await callGemini(prompt)
    return JSON.parse(text) as Word[]
  } catch (err) {
    console.error('enrichWords error:', err)
    return words.map(w => ({ word: w, vietnamese: '...', type: 'n', example: '...' }))
  }
}

export async function generateSentences(words: Word[]): Promise<SentenceItem[]> {
  const prompt = `You are an English teacher creating fill-in-the-blank exercises for Vietnamese B1/B2 students.

Given these vocabulary words (with meanings), create one fill-in-the-blank sentence for EACH word.

Rules:
- Each sentence must be 8-15 words long
- Use "______" (6 underscores) as the blank
- The sentence context must make the correct answer clear
- Write at B1/B2 level — natural, not overly formal
- The blank must be filled by exactly the word provided (not a synonym)
- Return ONLY a valid JSON array, no explanation, no markdown, no code blocks

Each item in the array must have:
- "sentence": the sentence string containing "______"
- "answer": the correct word that fills the blank

Words and meanings:
${words.map(w => `- ${w.word} (${w.type}): ${w.vietnamese} — "${w.example}"`).join('\n')}`

  const text = await callGemini(prompt)
  const raw = JSON.parse(text) as { sentence: string; answer: string }[]
  const allWords = words.map(w => w.word)
  return raw.map(item => ({
    ...item,
    options: [...allWords].sort(() => Math.random() - 0.5),
  }))
}
