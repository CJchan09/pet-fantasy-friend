import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReflectionStore } from '@/store/useReflectionStore'
import {
  EMPTY_REFLECTION_ANSWERS,
  calculateReflectionReward,
  countFilledAnswers,
  isReflectionSubmittable,
} from '@/domain/reflection'
import type { MoodValue, ReflectionAnswers } from '@/types'
import { MoodPicker } from './MoodPicker'

interface ReflectionFormProps {
  onSubmitted?: () => void
}

/**
 * 每日反思三问表单。提交前（今天还没提交过）实时保存草稿，避免意外关闭页面丢内容；
 * 已提交过的当天内容可以继续编辑，编辑不重复发放星尘。
 * 收益提示随填写进度实时更新（UI 规格 屏二 规则 5）。
 */
export function ReflectionForm({ onSubmitted }: ReflectionFormProps) {
  const { t } = useTranslation()
  const { hasSubmittedToday, todayEntry, draftReflection, saveDraft, submitReflection } =
    useReflectionStore()

  const [answers, setAnswers] = useState<ReflectionAnswers>(
    todayEntry?.answers ?? draftReflection?.answers ?? EMPTY_REFLECTION_ANSWERS,
  )
  const [mood, setMood] = useState<MoodValue | undefined>(
    todayEntry?.mood ?? draftReflection?.mood,
  )

  // 当天首次提交前，答案变化时实时写草稿（PRD 3.3.2：关闭页面输入内容实时保存）
  useEffect(() => {
    if (!hasSubmittedToday) {
      saveDraft(answers, mood)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, mood, hasSubmittedToday])

  function updateAnswer(field: keyof ReflectionAnswers, value: string) {
    setAnswers((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    submitReflection(answers, mood)
    onSubmitted?.()
  }

  const canSubmit = isReflectionSubmittable(answers)
  const filled = countFilledAnswers(answers)
  const potentialReward = calculateReflectionReward(answers)

  const rewardHint = hasSubmittedToday
    ? t('reflection.alreadySubmittedHint')
    : filled === 0
      ? t('reflection.rewardHintIdle')
      : filled === 3
        ? t('reflection.rewardHintFull')
        : t('reflection.rewardHintPartial', { filled, stars: potentialReward })

  return (
    <div className="flex flex-col gap-4">
      <ReflectionQuestion
        label={t('reflection.questionGratitude')}
        value={answers.gratitude}
        onChange={(v) => updateAnswer('gratitude', v)}
      />
      <ReflectionQuestion
        label={t('reflection.questionLearning')}
        value={answers.learning}
        onChange={(v) => updateAnswer('learning', v)}
      />
      <ReflectionQuestion
        label={t('reflection.questionImprovement')}
        value={answers.improvement}
        onChange={(v) => updateAnswer('improvement', v)}
      />

      <div className="rounded-[20px] bg-card px-5 py-4 shadow-soft">
        <MoodPicker value={mood} onChange={setMood} />
      </div>

      <div className="mt-1 flex flex-col gap-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="rounded-2xl bg-gold-500 py-3.5 text-base font-medium tracking-wide text-[#FFFDF6] shadow-soft transition-colors active:bg-gold-600 disabled:opacity-40"
        >
          {hasSubmittedToday ? t('reflection.updateButton') : t('reflection.submitButton')}
        </button>
        <p className="text-center text-xs text-ink-500">{rewardHint}</p>
        {!hasSubmittedToday && (
          <p className="text-center text-[11px] text-ink-400">
            {t('reflection.draftHint')}
          </p>
        )}
      </div>
    </div>
  )
}

function ReflectionQuestion({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <label className="flex flex-col gap-2.5 rounded-[20px] bg-card px-5 py-4 shadow-soft">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('reflection.answerPlaceholder')}
        rows={2}
        className="resize-none rounded-xl bg-cream-100 px-3 py-2.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400 focus:ring-1 focus:ring-gold-500/40"
      />
    </label>
  )
}
