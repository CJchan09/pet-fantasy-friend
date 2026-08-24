import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PetSprite } from '../PetSprite'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('PetSprite', () => {
  it('闭眼帧会停留足够久，不会只闪过一下', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<PetSprite species="mossbear" joy={false} alt="苔藓熊" />)

    const sprite = screen.getByRole('img', { name: '苔藓熊' })
    const currentFrame = () => sprite.querySelector('[data-current-frame="true"]')

    act(() => vi.advanceTimersByTime(3500))
    expect(currentFrame()).toHaveAttribute('src', '/creatures/mossbear_s1_eyes-closed.webp')

    act(() => vi.advanceTimersByTime(500))
    expect(currentFrame()).toHaveAttribute('src', '/creatures/mossbear_s1_eyes-closed.webp')

    act(() => vi.advanceTimersByTime(150))
    expect(currentFrame()).toHaveAttribute('src', '/creatures/mossbear_s1_eyes-open.webp')
  })

  it('有动作帧的宠物会依次播放走路 A/B，再回到睁眼帧', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<PetSprite species="mossbear" joy={false} alt="苔藓熊" />)

    const sprite = screen.getByRole('img', { name: '苔藓熊' })
    const currentFrame = () => sprite.querySelector('[data-current-frame="true"]')
    expect(currentFrame()).toHaveAttribute('src', '/creatures/mossbear_s1_eyes-open.webp')

    act(() => vi.advanceTimersByTime(6000))
    expect(currentFrame()).toHaveAttribute('src', '/creatures/mossbear_s1_walk-a.webp')

    act(() => vi.advanceTimersByTime(240))
    expect(currentFrame()).toHaveAttribute('src', '/creatures/mossbear_s1_walk-b.webp')

    act(() => vi.advanceTimersByTime(240 * 5))
    expect(currentFrame()).toHaveAttribute('src', '/creatures/mossbear_s1_eyes-open.webp')
  })

  it('未配置动作帧的抽蛋宠物不会请求走路图片', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<PetSprite species="mistdeer" joy={false} alt="雾鹿" />)

    const sprite = screen.getByRole('img', { name: '雾鹿' })
    act(() => vi.advanceTimersByTime(12000))
    expect(sprite.querySelector('[data-current-frame="true"]')?.getAttribute('src')).not.toContain('walk-')
  })

  it('会根据生命阶段加载对应资产', () => {
    render(<PetSprite species="mossbear" stage={3} joy={false} alt="苔藓熊" />)
    const sprite = screen.getByRole('img', { name: '苔藓熊' })
    expect(sprite.querySelector('[data-current-frame="true"]')).toHaveAttribute(
      'src',
      '/creatures/mossbear_s3_eyes-open.webp',
    )
  })
})
