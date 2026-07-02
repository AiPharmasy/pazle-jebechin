'use client'

import {
  useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore,
} from 'react'
import { Button } from '@/components/ui/button'
import {
  LEVELS, ParsedLevel, parseLevel, isWin, countBoxes,
} from '@/lib/levels'
import { getSound } from '@/lib/sound'
import { fetchAd, getFallbackAd, AdData } from '@/lib/ads'
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Undo2, RotateCcw, Menu as MenuIcon, Trophy, Lock, Star,
  ArrowRight, ArrowLeft, Sparkles, Boxes, Target, Footprints,
  Volume2, VolumeX, ExternalLink,
} from 'lucide-react'

type Dir = 'up' | 'down' | 'left' | 'right'

interface HistoryStep {
  player: { x: number; y: number }
  boxes: boolean[][]
  dir: Dir
}

const STORAGE_KEY = 'sokoban_progress_v2'

interface Progress {
  completed: number[]
  bestMoves: Record<number, number>
  unlocked: number
}

const emptyProgress: Progress = { completed: [], bestMoves: {}, unlocked: 1 }

let cachedProgress: Progress | null = null
let cachedRaw: string | null = null

function loadProgress(): Progress {
  if (typeof window === 'undefined') return emptyProgress
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw && cachedProgress) return cachedProgress
    if (!raw) { cachedProgress = emptyProgress; cachedRaw = null; return emptyProgress }
    const p = JSON.parse(raw) as Partial<Progress>
    cachedProgress = {
      completed: p.completed ?? [],
      bestMoves: p.bestMoves ?? {},
      unlocked: p.unlocked ?? 1,
    }
    cachedRaw = raw
    return cachedProgress
  } catch {
    cachedProgress = emptyProgress; cachedRaw = null; return emptyProgress
  }
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    cachedRaw = null
    window.dispatchEvent(new Event('sokoban-progress-change'))
  } catch { /* ignore */ }
}

function subscribeProgress(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('sokoban-progress-change', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('sokoban-progress-change', callback)
    window.removeEventListener('storage', callback)
  }
}

function calcStars(moves: number, par: number): 1 | 2 | 3 {
  if (moves <= par) return 3
  if (moves <= Math.ceil(par * 1.4)) return 2
  return 1
}

export default function Home() {
  const [screen, setScreen] = useState<'menu' | 'levels' | 'game'>('menu')
  const progress = useSyncExternalStore(subscribeProgress, loadProgress, () => emptyProgress)
  const [currentLevel, setCurrentLevel] = useState<number>(0)

  const startLevel = (idx: number) => { setCurrentLevel(idx); setScreen('game') }

  const handleWin = (levelId: number, moves: number) => {
    const prev = loadProgress()
    const completed = prev.completed.includes(levelId) ? prev.completed : [...prev.completed, levelId]
    const prevBest = prev.bestMoves[levelId]
    const bestMoves = { ...prev.bestMoves, [levelId]: prevBest == null ? moves : Math.min(prevBest, moves) }
    const unlocked = Math.max(prev.unlocked, Math.min(levelId + 1, LEVELS.length))
    saveProgress({ completed, bestMoves, unlocked })
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top, #4c2a96 0%, #3f2b96 40%, #2c1a56 100%)',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Tahoma, "Vazirmatn", sans-serif',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      dir="rtl"
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(108, 92, 231, 0.4) 0%, transparent 8%), radial-gradient(circle at 75% 75%, rgba(255, 159, 67, 0.3) 0%, transparent 8%), radial-gradient(circle at 50% 10%, rgba(108, 92, 231, 0.3) 0%, transparent 6%), radial-gradient(circle at 10% 60%, rgba(255, 159, 67, 0.25) 0%, transparent 7%), radial-gradient(circle at 90% 40%, rgba(108, 92, 231, 0.3) 0%, transparent 6%)`,
          backgroundSize: '180px 180px, 220px 220px, 150px 150px, 200px 200px, 170px 170px',
        }}
      />
      <div className="relative z-10 w-full flex flex-col items-center min-h-screen">
        {screen === 'menu' && <MenuScreen progress={progress} onPlay={() => setScreen('levels')} />}
        {screen === 'levels' && <LevelsScreen progress={progress} onBack={() => setScreen('menu')} onSelect={startLevel} />}
        {screen === 'game' && <GameScreen key={currentLevel} levelIndex={currentLevel} onMenu={() => setScreen('levels')} onNext={(idx) => startLevel(idx)} onWin={handleWin} totalLevels={LEVELS.length} />}
      </div>
    </div>
  )
}

/* ============== MENU SCREEN ============== */
function MenuScreen({ progress, onPlay }: { progress: Progress; onPlay: () => void }) {
  const completedCount = progress.completed.length
  const totalStars = Object.entries(progress.bestMoves).reduce((sum, [id, m]) => {
    const lvl = LEVELS.find((l) => l.id === Number(id))
    if (!lvl) return sum
    return sum + calcStars(m, lvl.par)
  }, 0)
  const pct = Math.round((completedCount / LEVELS.length) * 100)
  const [muted, setMuted] = useState(() => getSound().isMuted())
  const [ad, setAd] = useState<AdData>(getFallbackAd())

  useEffect(() => {
    let mounted = true
    fetchAd().then((fetched) => { if (mounted) setAd(fetched) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const sound = getSound()
    if (sound.isMuted()) return
    sound.startMusic()
    const startOnInteraction = () => { if (!sound.isMusicPlaying()) sound.startMusic() }
    window.addEventListener('click', startOnInteraction, { once: true })
    window.addEventListener('touchstart', startOnInteraction, { once: true })
    window.addEventListener('keydown', startOnInteraction, { once: true })
    return () => {
      window.removeEventListener('click', startOnInteraction)
      window.removeEventListener('touchstart', startOnInteraction)
      window.removeEventListener('keydown', startOnInteraction)
      sound.stopMusic()
    }
  }, [])

  const toggleMute = () => {
    const newMuted = !muted
    setMuted(newMuted)
    getSound().setMuted(newMuted)
    if (!newMuted) { getSound().click(); getSound().startMusic() }
  }

  return (
    <div className="flex-1 w-full max-w-md flex flex-col items-center justify-start px-6 py-8 gap-6">
      <div className="w-full flex justify-end -mb-3">
        <button onClick={toggleMute} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 border border-white/15 text-white hover:bg-white/15 transition-colors" aria-label={muted ? 'فعال‌سازی صدا' : 'بی‌صدا کردن'}>
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <BlockStackLogo size={120} />

      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight" style={{ color: '#ff9f43', textShadow: '0 2px 0 #ffffff, 0 4px 8px rgba(0,0,0,0.3)', WebkitTextStroke: '1px #ffffff' }}>
          پازل جعبه‌چین
        </h1>
        <p className="text-sm text-white/80 mt-2">بازی پازلی با چالش‌های هیجان‌انگیز</p>
      </div>

      <div className="w-full grid grid-cols-3 gap-3">
        <CircleStat icon={<span className="text-lg font-black">٪</span>} value={`${pct}`} label="پازل" color="#9b59b6" />
        <CircleStat icon={<Star className="w-5 h-5" fill="white" />} value={`${totalStars}`} label="ستاره" color="#f1c40f" />
        <CircleStat icon={<Trophy className="w-5 h-5" />} value={`${completedCount}`} label="جایزه" color="#27ae60" />
      </div>

      <Button onClick={() => { getSound().click(); onPlay() }} className="w-full h-16 text-xl font-black rounded-2xl border-0 relative overflow-hidden group"
        style={{ background: 'linear-gradient(135deg, #ffb84d 0%, #ff9f43 50%, #e8893c 100%)', color: 'white', boxShadow: '0 10px 30px rgba(255, 159, 67, 0.5), inset 0 -4px 0 rgba(180, 100, 30, 0.4), inset 0 4px 0 rgba(255, 255, 255, 0.3)', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
        <span className="relative z-10 flex items-center gap-2">{completedCount > 0 ? 'بازگشت به بازی' : 'شروع بازی'}<ArrowLeft className="w-5 h-5" /></span>
      </Button>

      <div className="w-full p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm text-sm space-y-3">
        <div className="font-bold text-yellow-300 flex items-center gap-2 text-base"><span className="text-xl">💡</span>راهنمای بازی</div>
        <div className="flex items-start gap-3 text-white/90"><span className="w-8 h-8 shrink-0 rounded-full bg-orange-500/30 flex items-center justify-center text-base">👆</span><span className="leading-relaxed">با کشیدن انگشت روی صفحه یا دکمه‌های جهت‌نما حرکت کنید</span></div>
        <div className="flex items-start gap-3 text-white/90"><span className="w-8 h-8 shrink-0 rounded-full bg-orange-500/30 flex items-center justify-center text-base">📦</span><span className="leading-relaxed">جعبه‌های نارنجی را به سمت نقاط طلایی 🎯 برسانید</span></div>
        <div className="flex items-start gap-3 text-white/90"><span className="w-8 h-8 shrink-0 rounded-full bg-rose-500/30 flex items-center justify-center text-base">⚠️</span><span className="leading-relaxed">مراقب باشید — جعبه‌ای که به گوشه می‌رود، گیر می‌کند!</span></div>
      </div>

      <AdBanner ad={ad} />
    </div>
  )
}

/* ============== 3D BLOCK STACK LOGO ============== */
function BlockStackLogo({ size = 120 }: { size?: number }) {
  const s = size
  const blockH = s * 0.22
  const gap = s * 0.015
  return (
    <div style={{ width: s, height: s, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', transform: 'rotate(-6deg)' }}>
      <div style={{ width: s * 0.3, height: blockH, background: 'linear-gradient(145deg, #fff4a3 0%, #ffd700 35%, #f1c40f 75%, #d4ac0d 100%)', borderRadius: s * 0.05, boxShadow: `0 ${s*0.04}px ${s*0.06}px rgba(241,196,15,0.5), inset 0 ${-s*0.03}px 0 rgba(160,120,0,0.4), inset 0 ${s*0.025}px 0 rgba(255,255,255,0.5)`, marginBottom: gap, position: 'relative' }}>
        <div style={{ position: 'absolute', top: s*0.03, left: s*0.03, width: '30%', height: '25%', background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, transparent 100%)', borderRadius: s*0.025 }} />
      </div>
      <div style={{ display: 'flex', gap, marginBottom: gap, width: s*0.5, justifyContent: 'center', flexDirection: 'row', direction: 'ltr' }}>
        <div style={{ flex: 1, height: blockH, background: 'linear-gradient(145deg, #6fc4f5 0%, #2196f3 45%, #1976d2 100%)', borderRadius: s*0.05, boxShadow: `0 ${s*0.04}px ${s*0.06}px rgba(33,150,243,0.5), inset 0 ${-s*0.03}px 0 rgba(10,71,122,0.4), inset 0 ${s*0.025}px 0 rgba(255,255,255,0.4)`, position: 'relative' }}>
          <div style={{ position: 'absolute', top: s*0.03, left: s*0.03, width: '30%', height: '22%', background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, transparent 100%)', borderRadius: s*0.025 }} />
        </div>
        <div style={{ flex: 1, height: blockH, background: 'linear-gradient(145deg, #6ee090 0%, #2ecc71 45%, #27ae60 100%)', borderRadius: s*0.05, boxShadow: `0 ${s*0.04}px ${s*0.06}px rgba(46,204,113,0.5), inset 0 ${-s*0.03}px 0 rgba(17,95,36,0.4), inset 0 ${s*0.025}px 0 rgba(255,255,255,0.4)`, position: 'relative' }}>
          <div style={{ position: 'absolute', top: s*0.03, left: s*0.03, width: '30%', height: '22%', background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, transparent 100%)', borderRadius: s*0.025 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap, width: s*0.7, justifyContent: 'center', flexDirection: 'row', direction: 'ltr' }}>
        {[0,1,2].map((i) => (
          <div key={i} style={{ flex: 1, height: blockH, background: 'linear-gradient(145deg, #ff7a6b 0%, #f44336 45%, #d32f2f 100%)', borderRadius: s*0.05, boxShadow: `0 ${s*0.04}px ${s*0.06}px rgba(211,47,47,0.5), inset 0 ${-s*0.03}px 0 rgba(127,14,14,0.4), inset 0 ${s*0.025}px 0 rgba(255,255,255,0.35)`, position: 'relative' }}>
            <div style={{ position: 'absolute', top: s*0.03, left: s*0.03, width: '30%', height: '22%', background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, transparent 100%)', borderRadius: s*0.025 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============== CIRCLE STAT ============== */
function CircleStat({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-white relative"
        style={{ background: `linear-gradient(145deg, ${color}dd 0%, ${color} 60%, ${color}aa 100%)`, boxShadow: `0 6px 16px ${color}66, inset 0 -4px 0 rgba(0,0,0,0.2), inset 0 4px 0 rgba(255,255,255,0.25)`, border: `2px solid ${color}` }}>
        {icon}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-slate-800 rounded-full min-w-7 h-7 px-2 flex items-center justify-center text-sm font-black shadow-md">{value}</div>
      </div>
      <div className="text-xs text-white/80 font-bold mt-2">{label}</div>
    </div>
  )
}

/* ============== LEVELS SCREEN ============== */
function LevelsScreen({ progress, onBack, onSelect }: { progress: Progress; onBack: () => void; onSelect: (idx: number) => void }) {
  return (
    <div className="flex-1 w-full max-w-md flex flex-col px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/10"><ArrowRight className="w-5 h-5 ml-1" />منو</Button>
        <h2 className="text-xl font-bold">انتخاب مرحله</h2>
        <div className="w-16" />
      </div>
      <div className="grid grid-cols-4 gap-3 overflow-y-auto pb-4">
        {LEVELS.map((lvl, idx) => {
          const unlocked = lvl.id <= progress.unlocked
          const completed = progress.completed.includes(lvl.id)
          const best = progress.bestMoves[lvl.id]
          const stars = best != null ? calcStars(best, lvl.par) : 0
          return (
            <button key={lvl.id} disabled={!unlocked} onClick={() => onSelect(idx)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-between p-2 transition-all duration-200 active:scale-95 relative ${unlocked ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-40'}`}
              style={{
                background: completed ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : unlocked ? 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)' : 'rgba(255,255,255,0.05)',
                border: completed ? '1px solid rgba(16, 185, 129, 0.5)' : unlocked ? '1px solid rgba(249, 115, 22, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: unlocked ? completed ? '0 6px 20px rgba(5, 150, 105, 0.35)' : '0 6px 20px rgba(249, 115, 22, 0.3)' : 'none',
              }}>
              {!unlocked ? (
                <div className="flex-1 flex items-center justify-center"><Lock className="w-6 h-6 text-slate-500" /></div>
              ) : (
                <>
                  <div className="text-[9px] text-white/70 font-medium mt-1">{lvl.difficulty}</div>
                  <div className="text-3xl font-black text-white">{lvl.id}</div>
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3].map((s) => <Star key={s} className={`w-3 h-3 ${s <= stars ? 'text-yellow-300 fill-yellow-300' : 'text-white/20'}`} />)}
                  </div>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ============== GAME SCREEN ============== */
function GameScreen({ levelIndex, onMenu, onNext, onWin, totalLevels }: {
  levelIndex: number; onMenu: () => void; onNext: (idx: number) => void; onWin: (levelId: number, moves: number) => void; totalLevels: number
}) {
  const level = LEVELS[levelIndex]
  const parsed = useMemo(() => parseLevel(level.map), [level])
  const totalBoxes = useMemo(() => countBoxes(parsed), [parsed])
  const [player, setPlayer] = useState(parsed.player)
  const [boxes, setBoxes] = useState<boolean[][]>(() => parsed.boxes.map((r) => [...r]))
  const [history, setHistory] = useState<HistoryStep[]>([])
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const [facing, setFacing] = useState<Dir>('down')
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'push'>('idle')
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const placedBoxes = useMemo(() => {
    let n = 0
    for (let y = 0; y < parsed.height; y++) for (let x = 0; x < parsed.width; x++) if (boxes[y][x] && parsed.goals[y][x]) n++
    return n
  }, [boxes, parsed])

  useEffect(() => { getSound().stopMusic() }, [])

  const tryMove = useCallback((dir: Dir) => {
    if (won) return
    const sound = getSound()
    setFacing(dir); setPlayerAnim('push'); setTimeout(() => setPlayerAnim('idle'), 150)
    const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
    const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0
    const nx = player.x + dx, ny = player.y + dy
    if (nx < 0 || ny < 0 || nx >= parsed.width || ny >= parsed.height) { sound.blocked(); return }
    if (parsed.walls[ny][nx]) { sound.blocked(); return }
    if (boxes[ny][nx]) {
      const bx = nx + dx, by = ny + dy
      if (bx < 0 || by < 0 || bx >= parsed.width || by >= parsed.height) { sound.blocked(); return }
      if (parsed.walls[by][bx]) { sound.blocked(); return }
      if (boxes[by][bx]) { sound.blocked(); return }
      const wasOnGoal = parsed.goals[ny][nx]
      const willBeOnGoal = parsed.goals[by][bx]
      setHistory((h) => [...h, { player: { ...player }, boxes: boxes.map((r) => [...r]), dir }])
      const newBoxes = boxes.map((r) => [...r])
      newBoxes[ny][nx] = false; newBoxes[by][bx] = true
      setBoxes(newBoxes); setPlayer({ x: nx, y: ny })
      const newMoveCount = moves + 1; setMoves(newMoveCount)
      sound.push()
      if (!wasOnGoal && willBeOnGoal) sound.boxOnGoal()
      else if (wasOnGoal && !willBeOnGoal) sound.boxOffGoal()
      if (isWin({ ...parsed, boxes: newBoxes, player: { x: nx, y: ny } })) {
        setWon(true); onWin(level.id, newMoveCount); setTimeout(() => sound.win(), 200)
      }
    } else {
      setHistory((h) => [...h, { player: { ...player }, boxes: boxes.map((r) => [...r]), dir }])
      setPlayer({ x: nx, y: ny }); setMoves((m) => m + 1); sound.move()
    }
  }, [player, boxes, parsed, won, level.id, onWin, moves])

  const undo = useCallback(() => {
    if (history.length === 0 || won) return
    const last = history[history.length - 1]
    setPlayer(last.player); setBoxes(last.boxes); setFacing(last.dir)
    setHistory((h) => h.slice(0, -1)); setMoves((m) => Math.max(0, m - 1)); getSound().undo()
  }, [history, won])

  const reset = useCallback(() => {
    const p = parseLevel(level.map)
    setPlayer(p.player); setBoxes(p.boxes.map((r) => [...r])); setHistory([]); setMoves(0); setWon(false); setFacing('down'); getSound().reset()
  }, [level.map])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); tryMove('up') }
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); tryMove('down') }
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); tryMove('left') }
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); tryMove('right') }
      else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo() }
      else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); reset() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tryMove, undo, reset])

  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touchStart.current = { x: t.clientX, y: t.clientY } }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x, dy = t.clientY - touchStart.current.y
    const absX = Math.abs(dx), absY = Math.abs(dy)
    if (absX < 25 && absY < 25) return
    if (absX > absY) tryMove(dx > 0 ? 'right' : 'left')
    else tryMove(dy > 0 ? 'down' : 'up')
    touchStart.current = null
  }

  const [actualCellSize, setActualCellSize] = useState(40)
  useEffect(() => {
    const calc = () => {
      const maxW = Math.min(window.innerWidth - 24, 440)
      const maxH = (window.innerHeight || 600) - 360
      const sizeByW = Math.floor(maxW / parsed.width)
      const sizeByH = Math.floor(maxH / parsed.height)
      setActualCellSize(Math.max(22, Math.min(58, Math.min(sizeByW, sizeByH))))
    }
    calc(); window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [parsed.width, parsed.height])

  const stars: 0 | 1 | 2 | 3 = won ? calcStars(moves, level.par) : 0

  return (
    <div className="flex-1 w-full max-w-md flex flex-col px-3 py-4 gap-3">
      {/* Top HUD */}
      <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
        style={{ background: 'linear-gradient(145deg, #1a3a6c 0%, #0f2545 100%)', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(15, 37, 69, 0.4)' }}>
        <Button variant="ghost" size="sm" onClick={onMenu} className="text-white hover:bg-white/10 shrink-0"><ArrowRight className="w-5 h-5 ml-1" />منو</Button>
        <div className="flex flex-col items-center min-w-0">
          <div className="text-sm font-bold truncate text-white">مرحله {level.id} — {level.name}</div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded-full" style={{
              background: level.difficulty === 'آسان' ? 'rgba(46, 204, 113, 0.25)' : level.difficulty === 'متوسط' ? 'rgba(241, 196, 15, 0.25)' : level.difficulty === 'سخت' ? 'rgba(231, 76, 60, 0.25)' : 'rgba(155, 89, 182, 0.25)',
              color: level.difficulty === 'آسان' ? '#2ecc71' : level.difficulty === 'متوسط' ? '#f1c40f' : level.difficulty === 'سخت' ? '#e74c3c' : '#bb8fce',
            }}>{level.difficulty}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg shrink-0" style={{ background: 'rgba(255, 215, 0, 0.15)' }}>
          <Footprints className="w-3.5 h-3.5 text-yellow-300" />
          <span className="font-bold text-yellow-300">{moves}</span>
          <span className="text-white/50">/</span>
          <span className="text-white/70">{level.par}</span>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(145deg, #5dade2 0%, #6c5ce7 100%)', border: '2px solid rgba(255, 255, 255, 0.15)', boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.2), 0 8px 32px rgba(108, 92, 231, 0.3)', minHeight: 220 }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="relative" style={{ width: parsed.width * actualCellSize, height: parsed.height * actualCellSize }}>
          {Array.from({ length: parsed.height }).map((_, y) =>
            Array.from({ length: parsed.width }).map((_, x) => {
              const isWall = parsed.walls[y][x]
              const isGoal = parsed.goals[y][x]
              const isBox = boxes[y][x]
              const isPlayer = player.x === x && player.y === y
              const boxOnGoal = isBox && isGoal
              const checker = (x + y) % 2 === 0
              if (isWall) return <div key={`w-${x}-${y}`} style={{ position: 'absolute', left: x*actualCellSize, top: y*actualCellSize, width: actualCellSize, height: actualCellSize }}><WallTile size={actualCellSize} /></div>
              return (
                <div key={`f-${x}-${y}`} style={{ position: 'absolute', left: x*actualCellSize, top: y*actualCellSize, width: actualCellSize, height: actualCellSize, background: checker ? 'rgba(133, 193, 233, 0.5)' : 'rgba(133, 193, 233, 0.7)' }}>
                  {isGoal && (
                    <div style={{ position: 'absolute', inset: actualCellSize*0.2, borderRadius: '50%', border: '3px dashed #ffd700', background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)', animation: 'goalPulse 2s ease-in-out infinite', boxShadow: '0 0 12px rgba(255, 215, 0, 0.4)' }}>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: actualCellSize*0.15, height: actualCellSize*0.15, borderRadius: '50%', background: '#ffd700', boxShadow: '0 0 8px #ffd700' }} />
                    </div>
                  )}
                  {isBox && (
                    <div style={{ position: 'absolute', inset: actualCellSize*0.06, transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: boxOnGoal ? 'scale(0.92)' : 'scale(1)' }}>
                      <CrateTile size={actualCellSize} onGoal={boxOnGoal} />
                    </div>
                  )}
                  {isPlayer && (
                    <div style={{ position: 'absolute', inset: actualCellSize*0.08, transition: 'all 0.15s ease-out', transform: playerAnim === 'push' ? 'scale(1.05)' : 'scale(1)' }}>
                      <PlayerTile size={actualCellSize} facing={facing} />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
          style={{ background: 'linear-gradient(145deg, #1a3a6c 0%, #0f2545 100%)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <Target className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-bold text-white">{placedBoxes}</span>
          <span className="text-white/50">/</span>
          <span className="text-white/70">{totalBoxes}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-5">
        <div dir="ltr" className="grid grid-cols-3 grid-rows-2 gap-4" style={{ width: 220 }}>
          <div />
          <DPadButton dir="up" onPress={() => tryMove('up')}><ChevronUp className="w-8 h-8" strokeWidth={2.5} /></DPadButton>
          <div />
          <DPadButton dir="left" onPress={() => tryMove('left')}><ChevronLeft className="w-8 h-8" strokeWidth={2.5} /></DPadButton>
          <DPadButton dir="down" onPress={() => tryMove('down')}><ChevronDown className="w-8 h-8" strokeWidth={2.5} /></DPadButton>
          <DPadButton dir="right" onPress={() => tryMove('right')}><ChevronRight className="w-8 h-8" strokeWidth={2.5} /></DPadButton>
        </div>
        <div className="flex gap-4 w-full">
          <Button variant="outline" onClick={undo} disabled={history.length === 0 || won} className="flex-1 h-12 rounded-xl text-white"
            style={{ background: 'linear-gradient(145deg, #b370d9 0%, #9b59b6 50%, #7d3c98 100%)', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.25), inset 0 3px 0 rgba(255,255,255,0.25)' }}>
            <Undo2 className="w-4 h-4 ml-1.5" /><span className="text-sm">برگشت</span><span className="text-[10px] text-white/70 mr-1.5">({history.length})</span>
          </Button>
          <Button variant="outline" onClick={reset} className="flex-1 h-12 rounded-xl text-white"
            style={{ background: 'linear-gradient(145deg, #d7b5ed 0%, #bb8fce 50%, #9b59b6 100%)', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.25), inset 0 3px 0 rgba(255,255,255,0.25)' }}>
            <RotateCcw className="w-4 h-4 ml-1.5" /><span className="text-sm">شروع دوباره</span>
          </Button>
        </div>
      </div>

      {won && <WinModal level={level} moves={moves} stars={stars} hasNext={levelIndex + 1 < totalLevels} onMenu={onMenu} onNext={() => onNext(levelIndex + 1)} />}
    </div>
  )
}

/* ============== AD BANNER (FIXED: uses ad.link_url, not hardcoded) ============== */
function AdBanner({ ad }: { ad: AdData }) {
  const handleClick = () => {
    getSound().click()
    if (typeof window !== 'undefined') {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer')
    }
  }
  return (
    <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
      onClick={(e) => { e.preventDefault(); handleClick() }}
      className="w-full block rounded-2xl overflow-hidden backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)', boxShadow: '0 4px 16px rgba(251, 191, 36, 0.1)' }}
      aria-label={ad.title}>
      <div className="flex items-stretch">
        <div className="w-20 h-20 shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
          {ad.image_url ? (
            <img src={ad.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <Boxes className="w-9 h-9 text-white" strokeWidth={2} />
          )}
        </div>
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(251, 191, 36, 0.25)', color: '#fbbf24' }}>تبلیغ</span>
              {/* FIXED: Show the ad's actual link domain, not hardcoded chabooksaz.ir */}
              <span className="text-[9px] text-slate-400">{(() => { try { return new URL(ad.link_url).hostname } catch { return 'لینک' } })()}</span>
            </div>
            <div className="text-sm font-bold text-white truncate leading-tight">{ad.title}</div>
            {ad.description && <div className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-snug">{ad.description}</div>}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">{ad.cta_text}<ExternalLink className="w-3 h-3" /></span>
          </div>
        </div>
      </div>
    </a>
  )
}

/* ============== TILES ============== */
function WallTile({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, background: 'linear-gradient(145deg, #1a3a6c 0%, #0f2545 50%, #08182f 100%)', borderRadius: 6, boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.5), inset 0 3px 0 rgba(255,255,255,0.2), inset 3px 0 0 rgba(255,255,255,0.1), inset -3px 0 0 rgba(0,0,0,0.3)', position: 'relative', border: '1px solid #08182f' }}>
      <div style={{ position: 'absolute', inset: 2, borderRadius: 4, background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', top: '15%', left: '15%', width: '25%', height: '20%', background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 100%)', borderRadius: 3 }} />
    </div>
  )
}

function CrateTile({ size, onGoal }: { size: number; onGoal: boolean }) {
  const s = size
  return (
    <div style={{ width: s, height: s, borderRadius: 8, background: onGoal ? 'linear-gradient(145deg, #58d68d 0%, #2ecc71 45%, #27ae60 100%)' : 'linear-gradient(145deg, #ffb84d 0%, #ff9f43 45%, #e8893c 100%)', boxShadow: onGoal ? `0 ${s*0.08}px ${s*0.12}px rgba(46,204,113,0.6), inset 0 ${-s*0.06}px 0 rgba(17,95,36,0.4), inset 0 ${s*0.05}px 0 rgba(255,255,255,0.4)` : `0 ${s*0.08}px ${s*0.12}px rgba(255,159,67,0.6), inset 0 ${-s*0.06}px 0 rgba(180,100,30,0.4), inset 0 ${s*0.05}px 0 rgba(255,255,255,0.4)`, position: 'relative', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.15)' }}>
      <svg width={s} height={s} style={{ position: 'absolute', inset: 0, opacity: 0.3 }} viewBox="0 0 100 100">
        <line x1="15" y1="15" x2="85" y2="85" stroke="black" strokeWidth="4" strokeLinecap="round" />
        <line x1="85" y1="15" x2="15" y2="85" stroke="black" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', top: '12%', left: '12%', width: '32%', height: '25%', background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 70%, transparent 100%)', borderRadius: 6 }} />
      {onGoal && <div style={{ position: 'absolute', inset: '30%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: s*0.4, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>✓</div>}
    </div>
  )
}

function PlayerTile({ size, facing }: { size: number; facing: Dir }) {
  const s = size
  const eyeOffset = { up: { x: 0, y: -2 }, down: { x: 0, y: 1 }, left: { x: -2, y: 0 }, right: { x: 2, y: 0 } }[facing]
  return (
    <div style={{ width: s, height: s, borderRadius: '50%', background: 'linear-gradient(145deg, #6fc4f5 0%, #2196f3 45%, #1976d2 100%)', boxShadow: `0 ${s*0.08}px ${s*0.12}px rgba(33,150,243,0.6), inset 0 ${-s*0.06}px 0 rgba(10,71,122,0.4), inset 0 ${s*0.05}px 0 rgba(255,255,255,0.4)`, position: 'relative', transition: 'transform 0.1s ease-out', border: '1px solid rgba(0,0,0,0.1)' }}>
      <div style={{ position: 'absolute', top: '12%', left: '15%', width: '35%', height: '28%', background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 70%, transparent 100%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '35%', left: '28%', width: '14%', height: '17%', background: 'white', borderRadius: '50%', transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`, transition: 'transform 0.15s ease-out', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
        <div style={{ position: 'absolute', top: '30%', left: '30%', width: '50%', height: '50%', background: '#0f172a', borderRadius: '50%' }} />
      </div>
      <div style={{ position: 'absolute', top: '35%', right: '28%', width: '14%', height: '17%', background: 'white', borderRadius: '50%', transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`, transition: 'transform 0.15s ease-out', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
        <div style={{ position: 'absolute', top: '30%', left: '30%', width: '50%', height: '50%', background: '#0f172a', borderRadius: '50%' }} />
      </div>
      <div style={{ position: 'absolute', bottom: '22%', left: '32%', right: '32%', height: '14%', borderBottom: '3px solid #ff9f43', borderRadius: '0 0 50% 50%' }} />
    </div>
  )
}

function DPadButton({ children, onPress, dir }: { children: React.ReactNode; onPress: () => void; dir: Dir }) {
  return (
    <button onPointerDown={(e) => { e.preventDefault(); onPress() }}
      className="aspect-square rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all duration-100 select-none"
      style={{ background: 'linear-gradient(145deg, #b370d9 0%, #9b59b6 50%, #7d3c98 100%)', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.25), inset 0 3px 0 rgba(255,255,255,0.25), 0 4px 12px rgba(155, 89, 182, 0.4)', minHeight: 56 }}
      aria-label={dir}>{children}</button>
  )
}

/* ============== WIN MODAL ============== */
function WinModal({ level, moves, stars, hasNext, onMenu, onNext }: {
  level: (typeof LEVELS)[number]; moves: number; stars: 0 | 1 | 2 | 3; hasNext: boolean; onMenu: () => void; onNext: () => void
}) {
  const [ad, setAd] = useState<AdData>(getFallbackAd())
  useEffect(() => { let mounted = true; fetchAd().then((fetched) => { if (mounted) setAd(fetched) }); return () => { mounted = false } }, [])
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899']
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)' }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{ position: 'absolute', left: `${Math.random()*100}%`, top: '-20px', width: 8, height: 14, background: colors[i % colors.length], animation: `confettiFall ${2 + Math.random()*2}s linear ${Math.random()*0.5}s infinite`, borderRadius: 2 }} />
      ))}
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col items-center gap-4 text-center relative"
        style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(251, 191, 36, 0.3)', boxShadow: '0 25px 70px rgba(0, 0, 0, 0.6)', animation: 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 10px 30px rgba(251, 191, 36, 0.5)' }}>
          <Trophy className="w-12 h-12 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-amber-400">آفرین!</h2>
          <p className="text-slate-300 text-sm mt-1">مرحله {level.id} — «{level.name}» را تمام کردید</p>
        </div>
        <div className="flex gap-2 justify-center my-1">
          {[1,2,3].map((s) => (
            <Star key={s} className={`w-12 h-12 ${s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`}
              style={{ animation: s <= stars ? `starPop 0.5s ease-out ${s*0.15}s both` : 'none', filter: s <= stars ? 'drop-shadow(0 4px 8px rgba(251, 191, 36, 0.5))' : 'none' }} />
          ))}
        </div>
        <div className="flex gap-3 w-full">
          <div className="flex-1 bg-white/5 rounded-xl p-3 text-center"><div className="text-[10px] text-slate-400 mb-1">حرکت شما</div><div className="text-lg font-black text-amber-400">{moves}</div></div>
          <div className="flex-1 bg-white/5 rounded-xl p-3 text-center"><div className="text-[10px] text-slate-400 mb-1">حداکثر برای ۳ ستاره</div><div className="text-lg font-black text-slate-200">{level.par}</div></div>
        </div>
        <div className="w-full"><AdBanner ad={ad} /></div>
        <div className="flex gap-2 w-full mt-2">
          <Button variant="outline" onClick={onMenu} className="flex-1 h-12 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10">مراحل</Button>
          {hasNext ? (
            <Button onClick={onNext} className="flex-1 h-12 rounded-xl border-0" style={{ background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)', color: 'white', boxShadow: '0 6px 20px rgba(220, 38, 38, 0.35)' }}>
              مرحله بعد<ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          ) : (
            <Button onClick={onMenu} className="flex-1 h-12 rounded-xl border-0" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)' }}>
              <Trophy className="w-4 h-4 ml-1" />پایان
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
