export type SoundscapePreset = 'brown' | 'rain' | 'ocean'

interface SoundscapeHandle {
  setVolume: (volume: number) => void
  stop: () => void
}

const FADE_SECONDS = 0.22

function clampVolume(volume: number): number {
  return Math.min(1, Math.max(0, volume))
}

function createNoiseBuffer(
  context: AudioContext,
  color: 'white' | 'brown',
): AudioBuffer {
  const seconds = 12
  const frameCount = context.sampleRate * seconds
  const buffer = context.createBuffer(2, frameCount, context.sampleRate)

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const output = buffer.getChannelData(channel)
    let last = 0

    for (let i = 0; i < frameCount; i += 1) {
      const white = Math.random() * 2 - 1
      if (color === 'brown') {
        last = (last + 0.02 * white) / 1.02
        output[i] = last * 3.5
      } else {
        output[i] = white
      }
    }

    // Ease the tail back to the first sample so the internal loop has no audible click.
    const seamFrames = Math.floor(context.sampleRate * 0.08)
    const firstSample = output[0]
    for (let i = 0; i < seamFrames; i += 1) {
      const index = frameCount - seamFrames + i
      const progress = i / (seamFrames - 1)
      const blend = (1 - Math.cos(progress * Math.PI)) / 2
      output[index] = output[index] * (1 - blend) + firstSample * blend
    }
  }

  return buffer
}

function createLoopingNoise(
  context: AudioContext,
  color: 'white' | 'brown',
): AudioBufferSourceNode {
  const source = context.createBufferSource()
  source.buffer = createNoiseBuffer(context, color)
  source.loop = true
  return source
}

function addBrownNoise(
  context: AudioContext,
  output: AudioNode,
  sources: AudioScheduledSourceNode[],
) {
  const noise = createLoopingNoise(context, 'brown')
  const filter = context.createBiquadFilter()
  const gain = context.createGain()

  filter.type = 'lowpass'
  filter.frequency.value = 950
  filter.Q.value = 0.35
  gain.gain.value = 0.34

  noise.connect(filter).connect(gain).connect(output)
  noise.start()
  sources.push(noise)
}

function addRain(
  context: AudioContext,
  output: AudioNode,
  sources: AudioScheduledSourceNode[],
) {
  const rain = createLoopingNoise(context, 'white')
  const rainFilter = context.createBiquadFilter()
  const rainGain = context.createGain()

  rainFilter.type = 'bandpass'
  rainFilter.frequency.value = 1450
  rainFilter.Q.value = 0.45
  rainGain.gain.value = 0.13
  rain.connect(rainFilter).connect(rainGain).connect(output)

  const body = createLoopingNoise(context, 'brown')
  const bodyFilter = context.createBiquadFilter()
  const bodyGain = context.createGain()
  bodyFilter.type = 'lowpass'
  bodyFilter.frequency.value = 620
  bodyGain.gain.value = 0.16
  body.connect(bodyFilter).connect(bodyGain).connect(output)

  rain.start()
  body.start()
  sources.push(rain, body)
}

function addOcean(
  context: AudioContext,
  output: AudioNode,
  sources: AudioScheduledSourceNode[],
) {
  const ocean = createLoopingNoise(context, 'brown')
  const filter = context.createBiquadFilter()
  const swell = context.createGain()
  const lfo = context.createOscillator()
  const lfoDepth = context.createGain()

  filter.type = 'lowpass'
  filter.frequency.value = 720
  swell.gain.value = 0.17
  lfo.frequency.value = 0.075
  lfoDepth.gain.value = 0.1

  ocean.connect(filter).connect(swell).connect(output)
  lfo.connect(lfoDepth).connect(swell.gain)

  ocean.start()
  lfo.start()
  sources.push(ocean, lfo)
}

export function startSoundscape(
  preset: SoundscapePreset,
  initialVolume: number,
): SoundscapeHandle | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
    return null
  }

  const context = new window.AudioContext()
  const master = context.createGain()
  const sources: AudioScheduledSourceNode[] = []
  const now = context.currentTime
  let stopped = false

  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(clampVolume(initialVolume) * 0.72, now + FADE_SECONDS)
  master.connect(context.destination)

  if (preset === 'brown') {
    addBrownNoise(context, master, sources)
  } else if (preset === 'rain') {
    addRain(context, master, sources)
  } else {
    addOcean(context, master, sources)
  }

  void context.resume()

  return {
    setVolume(volume) {
      if (stopped) return
      const time = context.currentTime
      master.gain.cancelScheduledValues(time)
      master.gain.setTargetAtTime(clampVolume(volume) * 0.72, time, 0.04)
    },
    stop() {
      if (stopped) return
      stopped = true

      const time = context.currentTime
      master.gain.cancelScheduledValues(time)
      master.gain.setTargetAtTime(0, time, 0.045)

      window.setTimeout(() => {
        for (const source of sources) {
          try {
            source.stop()
          } catch {
            // The browser may already have stopped a source while closing the context.
          }
        }
        void context.close()
      }, FADE_SECONDS * 1000)
    },
  }
}
