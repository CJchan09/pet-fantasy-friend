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

/**
 * 宠物立绘：
 * - active：睁眼帧为默认，随机间隔眨眼（睁眼/闭眼两帧姿势对齐，直接切换）
 * - tired/dormant：显示对应的静态状态帧，不眨眼（PRD 3.3.3：疲倦动作变慢，沉睡蜷缩不动）
 * - 喂养时（joy=true）优先显示喜悦帧，无论生命周期状态如何
 */
export function PetSprite({ species, joy, lifecycleStatus = 'active', alt, className }: PetSpriteProps) {
  const [blinking, setBlinking] = useState(false)
  const timersRef = useRef<number[]>([])

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

  let src = eyesOpen
  if (joy) {
    src = joyFrame
  } else if (lifecycleStatus === 'dormant') {
    src = dormantFrame
  } else if (lifecycleStatus === 'tired') {
    src = tiredFrame
  } else {
    src = blinking ? eyesClosed : eyesOpen
  }

  return <img src={src} alt={alt} className={className} draggable={false} />
}
