import { useEffect, useRef, useState } from 'react'
import { creatureAsset } from '@/config/creatures'
import type { PetLifecycleStatus } from '@/domain/petLifecycle'

interface PetSpriteProps {
  species: string
  /** 喂养后短暂显示喜悦帧 */
  joy: boolean
  lifecycleStatus?: PetLifecycleStatus
  alt: string
  className?: string
}

const BLINK_MIN_INTERVAL_MS = 3500
const BLINK_MAX_INTERVAL_MS = 7000
const BLINK_DURATION_MS = 170

// 「活着」的循环小动作：待机久了偶尔快闪一下喜悦帧（没有额外的「精神一下」美术，
// 借用喂养喜悦帧最省事），跟眨眼是两条独立计时器，互不打架——同一瞬间两者都想显示时
// 直接让 perk 赢（元素级的一次点缀，视觉上盖掉那一帧眨眼不明显）。
const PERK_MIN_INTERVAL_MS = 6000
const PERK_MAX_INTERVAL_MS = 12000
const PERK_DURATION_MS = 450

/**
 * 宠物立绘：
 * - active：睁眼帧为默认，随机间隔眨眼（睁眼/闭眼两帧姿势对齐，直接切换）；
 *   另外叠加一条更慢的「精神一下」循环——借用喜悦帧短暂一闪，制造持续的「动起来」感，
 *   不是新增美术，是现有帧的循环播放（CJ 2026-08-12 要求）
 * - tired/dormant：显示对应的静态状态帧，不眨眼也不做 perk（PRD 3.3.3：疲倦动作变慢，沉睡蜷缩不动）
 * - 喂养时（joy=true）优先显示喜悦帧，无论生命周期状态如何，且暂停 perk 循环（避免两个喜悦帧来源打架）
 */
export function PetSprite({ species, joy, lifecycleStatus = 'active', alt, className }: PetSpriteProps) {
  const [blinking, setBlinking] = useState(false)
  const [perking, setPerking] = useState(false)
  const timersRef = useRef<number[]>([])
  const perkTimersRef = useRef<number[]>([])

  const eyesOpen = creatureAsset(species, 'eyes-open')
  const eyesClosed = creatureAsset(species, 'eyes-closed')
  const joyFrame = creatureAsset(species, 'joy')
  const tiredFrame = creatureAsset(species, 'tired')
  const dormantFrame = creatureAsset(species, 'dormant')

  const isActive = lifecycleStatus === 'active'

  // 预加载其他帧，避免切换时闪空
  useEffect(() => {
    for (const src of [eyesClosed, joyFrame, tiredFrame, dormantFrame]) {
      const img = new Image()
      img.src = src
    }
  }, [eyesClosed, joyFrame, tiredFrame, dormantFrame])

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
    if (joy || !isActive) {
      return
    }
    let cancelled = false

    function schedulePerk() {
      const delay =
        PERK_MIN_INTERVAL_MS + Math.random() * (PERK_MAX_INTERVAL_MS - PERK_MIN_INTERVAL_MS)
      perkTimersRef.current.push(
        window.setTimeout(() => {
          if (cancelled) return
          setPerking(true)
          perkTimersRef.current.push(
            window.setTimeout(() => {
              if (cancelled) return
              setPerking(false)
              schedulePerk()
            }, PERK_DURATION_MS),
          )
        }, delay),
      )
    }

    schedulePerk()
    return () => {
      cancelled = true
      perkTimersRef.current.forEach((id) => window.clearTimeout(id))
      perkTimersRef.current = []
      setPerking(false)
    }
  }, [joy, isActive])

  let src = eyesOpen
  if (joy) {
    src = joyFrame
  } else if (lifecycleStatus === 'dormant') {
    src = dormantFrame
  } else if (lifecycleStatus === 'tired') {
    src = tiredFrame
  } else if (perking) {
    src = joyFrame
  } else {
    src = blinking ? eyesClosed : eyesOpen
  }

  return <img src={src} alt={alt} className={className} draggable={false} />
}
