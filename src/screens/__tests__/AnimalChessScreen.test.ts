import { describe, expect, it } from 'vitest'
import { isGameOverMessage, isTrustedGameOverMessage } from '@/domain/animalChessMessage'

const VALID_MESSAGE = {
  source: 'dou-shou-qi',
  type: 'gameOver',
  winner: 'red',
  aiOwner: 'blue',
}

describe('AnimalChessScreen message boundary', () => {
  it('accepts only the complete game-over payload', () => {
    expect(isGameOverMessage(VALID_MESSAGE)).toBe(true)
    expect(isGameOverMessage({ ...VALID_MESSAGE, winner: 'green' })).toBe(false)
    expect(isGameOverMessage({ ...VALID_MESSAGE, aiOwner: undefined })).toBe(false)
  })

  it('requires both the embedded frame window and the current origin', () => {
    const expectedSource = window
    expect(
      isTrustedGameOverMessage(
        { data: VALID_MESSAGE, origin: window.location.origin, source: expectedSource },
        expectedSource,
        window.location.origin,
      ),
    ).toBe(true)

    expect(
      isTrustedGameOverMessage(
        { data: VALID_MESSAGE, origin: window.location.origin, source: null },
        expectedSource,
        window.location.origin,
      ),
    ).toBe(false)
    expect(
      isTrustedGameOverMessage(
        { data: VALID_MESSAGE, origin: 'https://attacker.example', source: expectedSource },
        expectedSource,
        window.location.origin,
      ),
    ).toBe(false)
  })
})
