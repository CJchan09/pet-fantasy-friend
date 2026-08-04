export interface ReflectionAnswers {
  gratitude: string
  learning: string
  improvement: string
}

export type MoodValue = 1 | 2 | 3 | 4 | 5

export interface ReflectionEntry {
  /** 本地设备日期，格式 YYYY-MM-DD，跨零点以此为准归属 */
  date: string
  answers: ReflectionAnswers
  mood?: MoodValue
  stardustAwarded: number
  updatedAt: string
}

export interface ReflectionDraft {
  date: string
  answers: ReflectionAnswers
  mood?: MoodValue
}

export interface PetState {
  name: string
  /** 生物种类 slug，对应 config/creatures.ts */
  species: string
  intimacy: number
  level: number
}

export interface StardustState {
  balance: number
}

export const CURRENT_SCHEMA_VERSION = 1

export interface AppState {
  schemaVersion: number
  pet: PetState
  stardust: StardustState
  reflections: ReflectionEntry[]
  draftReflection: ReflectionDraft | null
}
