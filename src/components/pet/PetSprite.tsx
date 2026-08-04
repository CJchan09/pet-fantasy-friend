import { useEffect, useRef, useState } from 'react'
import { creatureAsset } from '@/config/creatures'

interface PetSpriteProps {
  species: string
  /** 喂养后短暂显示喜悦帧 */
  joy: boolean
  alt: string
  className?: string
}

const BLINK_MIN_INTERVAL_MS = 3500
const BLINK_MAX_INTERVAL_MS = 7000
const BLINK_DURATION_MS = 170

/**
 * 宠物立绘：睁眼帧为默认，随机间隔眨眼（睁眼/闭眼两帧姿势对齐，直接切换）。
 * 喂养时切喜悦帧。疲倦/沉睡帧留给阶段二状态机。
 */
export function PetSprite({ species, joy, alt, className }: PetSpriteProps) {
  const [blinking, setBlinking] = useState(false)
  const timersRef = useRef<number[]>([])

  const eyesOpen = creatureAsset(species, 'eyes-open')
  const eyesClosed = creatureAsset(species, 'eyes-closed')
  const joyFrame = creatureAsset(species, 'joy')

  // 预加载闭眼与喜悦帧，避免首次切换闪空
  useEffect(() => {
    for (const src of [eyesClosed, joyFrame]) {
      const img = new Image()
      img.src = src
    }
  }, [eyesClosed, joyFrame])

  useEffect(() => {
    if (joy) {
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
  }, [joy])

  const src = joy ? joyFrame : blinking ? eyesClosed : eyesOpen

  return <img src={src} alt={alt} className={className} draggable={false} />
}
