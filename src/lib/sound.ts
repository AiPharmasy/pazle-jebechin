// Sound engine using Web Audio API — no external files needed.

class SoundEngine {
  private ctx: AudioContext | null = null
  private muted = false
  private musicNodes: { osc: OscillatorNode; gain: GainNode }[] = []
  private musicPlaying = false
  private musicTimer: number | null = null
  private musicGain: GainNode | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sokoban_muted')
        this.muted = stored === 'true'
      } catch { /* ignore */ }
    }
  }

  private ensureContext() {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || (window as any).webkitAudioContext
        this.ctx = new AC()
      } catch { return null }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  setMuted(muted: boolean) {
    this.muted = muted
    try { localStorage.setItem('sokoban_muted', String(muted)) } catch { /* ignore */ }
    if (muted) this.stopMusic()
  }

  isMuted() { return this.muted }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15, delay = 0) {
    if (this.muted) return
    const ctx = this.ensureContext()
    if (!ctx) return
    const start = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration + 0.05)
  }

  move() { this.playTone(220, 0.05, 'sine', 0.08) }
  push() { this.playTone(180, 0.08, 'square', 0.1); this.playTone(120, 0.1, 'triangle', 0.05, 0.02) }
  boxOnGoal() { this.playTone(523, 0.15, 'sine', 0.15); this.playTone(659, 0.15, 'sine', 0.12, 0.05); this.playTone(784, 0.2, 'sine', 0.12, 0.1) }
  boxOffGoal() { this.playTone(440, 0.1, 'triangle', 0.1); this.playTone(330, 0.12, 'triangle', 0.08, 0.05) }
  blocked() { this.playTone(80, 0.08, 'sawtooth', 0.08) }
  undo() { this.playTone(330, 0.06, 'sine', 0.08); this.playTone(220, 0.08, 'sine', 0.06, 0.04) }
  reset() { this.playTone(440, 0.06, 'sine', 0.08); this.playTone(330, 0.06, 'sine', 0.08, 0.05); this.playTone(220, 0.08, 'sine', 0.08, 0.1) }
  click() { this.playTone(440, 0.04, 'sine', 0.06) }

  win() {
    const notes: [number, number][] = [[523,0],[659,0.12],[784,0.24],[1047,0.36],[784,0.54],[1047,0.66],[1319,0.78]]
    notes.forEach(([f,d]) => this.playTone(f, 0.18, 'sine', 0.18, d))
    for (let i = 0; i < 6; i++) this.playTone(2000 + Math.random()*1000, 0.05, 'sine', 0.05, 0.9 + i*0.05)
  }

  startMusic() {
    if (this.muted || this.musicPlaying) return
    const ctx = this.ensureContext()
    if (!ctx) return
    this.musicPlaying = true
    this.musicGain = ctx.createGain()
    this.musicGain.gain.value = 0.06
    this.musicGain.connect(ctx.destination)
    this.scheduleMelody()
  }

  private scheduleMelody() {
    if (!this.musicPlaying || !this.ctx || !this.musicGain) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const chords = [[262,330,392],[196,247,294],[220,262,330],[175,220,262]]
    const melodyNotes = [523, 392, 440, 349]
    let t = 0
    for (let ci = 0; ci < chords.length; ci++) {
      const chord = chords[ci]
      for (const freq of chord) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, now + t)
        gain.gain.linearRampToValueAtTime(0.3, now + t + 0.2)
        gain.gain.linearRampToValueAtTime(0.2, now + t + 1.5)
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 2)
        osc.connect(gain); gain.connect(this.musicGain)
        osc.start(now + t); osc.stop(now + t + 2.1)
        this.musicNodes.push({ osc, gain })
      }
      const melOsc = ctx.createOscillator()
      const melGain = ctx.createGain()
      melOsc.type = 'triangle'
      melOsc.frequency.value = melodyNotes[ci]
      melGain.gain.setValueAtTime(0, now + t + 0.3)
      melGain.gain.linearRampToValueAtTime(0.15, now + t + 0.5)
      melGain.gain.exponentialRampToValueAtTime(0.001, now + t + 1.8)
      melOsc.connect(melGain); melGain.connect(this.musicGain)
      melOsc.start(now + t + 0.3); melOsc.stop(now + t + 1.9)
      this.musicNodes.push({ osc: melOsc, gain: melGain })
      t += 2
    }
    this.musicTimer = window.setTimeout(() => this.scheduleMelody(), 8000)
  }

  stopMusic() {
    this.musicPlaying = false
    if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null }
    for (const { osc, gain } of this.musicNodes) {
      try {
        gain.gain.cancelScheduledValues(0)
        gain.gain.setValueAtTime(gain.gain.value, this.ctx?.currentTime || 0)
        gain.gain.exponentialRampToValueAtTime(0.001, (this.ctx?.currentTime || 0) + 0.1)
        osc.stop((this.ctx?.currentTime || 0) + 0.15)
      } catch { /* already stopped */ }
    }
    this.musicNodes = []
    this.musicGain = null
  }

  isMusicPlaying() { return this.musicPlaying }
}

let soundInstance: SoundEngine | null = null
export function getSound(): SoundEngine {
  if (!soundInstance) soundInstance = new SoundEngine()
  return soundInstance
}
