import { useEffect, useRef, useState } from 'react'
import { ACTION_FRAME_SPECIES, creatureAsset } from '@/config/creatures'
import type { PetLifecycleStatus } from '@/domain/petLifecycle'

interface PetSpriteProps {
  species: string
  stage?: 1 | 2 | 3 | 4
  /** 喂养后短暂显示喜悦帧 */
  joy: boolean
  lifecycleStatus?: PetLifecycleStatus
  alt: string
  className?: string
}

const BLINK_MIN_INTERVAL_MS = 3500
const BLINK_MAX_INTERVAL_MS = 7000
const BLINK_DURATION_MS = 650

const WALK_MIN_INTERVAL_MS = 6000
const WALK_MAX_INTERVAL_MS = 12000
const WALK_FRAME_DURATION_MS = 240
const FRAME_CROSSFADE_MS = 140
const WALK_SEQUENCE: Array<0 | 1 | 2> = [1, 2, 1, 2, 1, 0]

/**
 * 宠物立绘：
 * - active：睁眼帧为默认，随机间隔眨眼（睁眼/闭眼两帧姿势对齐，直接切换）；
 *   有动作帧的生物会偶尔原地走两步，跟眨眼是两条独立计时器。
 * - tired/dormant：显示对应的静态状态帧，不眨眼也不走动（PRD 3.3.3）。
 * - 喂养时（joy=true）优先显示喜悦帧，并暂停其他循环。
 */
export function PetSprite({
  species,
  stage = 1,
  joy,
  lifecycleStatus = 'active',
  alt,
  className,
}: PetSpriteProps) {
  const [blinking, setBlinking] = useState(false)
  const [walkFrame, setWalkFrame] = useState<0 | 1 | 2>(0)
  const timersRef = useRef<number[]>([])
  const walkTimersRef = useRef<number[]>([])
  const transitionTimerRef = useRef<number | null>(null)

  const eyesOpen = creatureAsset(species, 'eyes-open', stage)
  const eyesClosed = creatureAsset(species, 'eyes-closed', stage)
  const joyFrame = creatureAsset(species, 'joy', stage)
  const tiredFrame = creatureAsset(species, 'tired', stage)
  const dormantFrame = creatureAsset(species, 'dormant', stage)
  const walkAFrame = creatureAsset(species, 'walk-a', stage)
  const walkBFrame = creatureAsset(species, 'walk-b', stage)

  const isActive = lifecycleStatus === 'active'
  const hasActionFrames = ACTION_FRAME_SPECIES.has(species)

  // 预加载其他帧，避免切换时闪空
  useEffect(() => {
    const sources = [eyesClosed, joyFrame, tiredFrame, dormantFrame]
    if (hasActionFrames) sources.push(walkAFrame, walkBFrame)
    for (const src of sources) {
      const img = new Image()
      img.src = src
    }
  }, [dormantFrame, eyesClosed, hasActionFrames, joyFrame, tiredFrame, walkAFrame, walkBFrame])

  useEffect(() => {
    if (joy || !isActive) {
      return
    }
    let cancelled = false

    function scheduleBlink() {
      const delay =
        BLINK_MIN_INTERVAL_MS +
        Math.random() * (BLINK_MAX_INTERVAL_MS - BLINK_MIN_INTERVAL_MS)
      timersRef.current.push(
        window.setTimeout(() => {
          if (cancelled) return
          setBlinking(true)
          timersRef.current.push(
            window.setTimeout(() => {
              if (cancelled) return
              setBlinking(false)
              scheduleBlink()
            }, BLINK_DURATION_MS),
          )
        }, delay),
      )
    }

    scheduleBlink()
    return () => {
      cancelled = true
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
      setBlinking(false)
    }
  }, [joy, isActive])

  useEffect(() => {
    if (joy || !isActive || !hasActionFrames) {
      return
    }
    let cancelled = false

    function scheduleWalk() {
      const delay =
        WALK_MIN_INTERVAL_MS + Math.random() * (WALK_MAX_INTERVAL_MS - WALK_MIN_INTERVAL_MS)
      walkTimersRef.current.push(
        window.setTimeout(() => {
          if (cancelled) return
          function playStep(index: number) {
            if (cancelled) return
            setWalkFrame(WALK_SEQUENCE[index])
            if (index === WALK_SEQUENCE.length - 1) {
              scheduleWalk()
              return
            }
            walkTimersRef.current.push(
              window.setTimeout(() => playStep(index + 1), WALK_FRAME_DURATION_MS),
            )
          }
          playStep(0)
        }, delay),
      )
    }

    scheduleWalk()
    return () => {
      cancelled = true
      walkTimersRef.current.forEach((id) => window.clearTimeout(id))
      walkTimersRef.current = []
      setWalkFrame(0)
    }
  }, [hasActionFrames, joy, isActive])

  let targetSrc = eyesOpen
  if (joy) {
    targetSrc = joyFrame
  } else if (lifecycleStatus === 'dormant') {
    targetSrc = dormantFrame
  } else if (lifecycleStatus === 'tired') {
    targetSrc = tiredFrame
  } else if (walkFrame === 1) {
    targetSrc = walkAFrame
  } else if (walkFrame === 2) {
    targetSrc = walkBFrame
  } else {
    targetSrc = blinking ? eyesClosed : eyesOpen
  }

  const [displayedSrc, setDisplayedSrc] = useState(targetSrc)
  const [leavingSrc, setLeavingSrc] = useState<string | null>(null)

  useEffect(() => {
    if (targetSrc === displayedSrc) return

    setLeavingSrc(displayedSrc)
    setDisplayedSrc(targetSrc)
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current)
    }
    transitionTimerRef.current = window.setTimeout(() => {
      setLeavingSrc(null)
      transitionTimerRef.current = null
    }, FRAME_CROSSFADE_MS)
  }, [displayedSrc, targetSrc])

  useEffect(
    () => () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
      }
    },
    [],
  )

  return (
    <span className={`relative inline-block flex-none ${className ?? ''}`} role="img" aria-label={alt}>
      <img
        key={displayedSrc}
        src={displayedSrc}
        alt=""
        aria-hidden="true"
        className="animate-sprite-frame-in absolute inset-0 h-full w-full object-contain"
        draggable={false}
        data-current-frame="true"
      />
      {leavingSrc && (
        <img
          key={`leaving-${leavingSrc}`}
          src={leavingSrc}
          alt=""
          aria-hidden="true"
          className="animate-sprite-frame-out absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
      )}
    </span>
  )
}
