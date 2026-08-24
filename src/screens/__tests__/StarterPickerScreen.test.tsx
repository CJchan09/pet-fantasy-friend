import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '@/i18n'
import { StarterPickerScreen } from '../StarterPickerScreen'

describe('StarterPickerScreen', () => {
  it('只显示苔藓熊、灵狐和云羊三只新幼年美术', () => {
    render(<StarterPickerScreen />)

    const sources = screen.getAllByRole('img').map((image) => image.getAttribute('src'))
    expect(sources).toEqual([
      '/creatures/mossbear_s1_eyes-open.webp',
      '/creatures/spiritfox_s1_eyes-open.webp',
      '/creatures/cloudsheep_s1_eyes-open.webp',
    ])
  })
})
