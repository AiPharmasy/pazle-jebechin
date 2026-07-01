'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { Button } from '@/components/ui/button'
import {
  LEVELS,
  ParsedLevel,
  parseLevel,
  isWin,
  countBoxes,
} from '@/lib/levels'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Undo2,
  RotateCcw,
  Menu as MenuIcon,
  Trophy,
  Lock,
  Star,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Boxes,
  Target,
  Footprints,
} from 'lucide-react'

type Dir = 'up' | 'down' | 'left' | 'right'

interface HistoryStep {
  player: { x: number; y: number }
  boxes: boolean[][]
  dir: Dir
}

const STORAGE_KEY = 'sokoban_progress_v2'

interface Progress {
  completed: number[] // level ids
  bestMoves: Record<number, number> // level id -> best move count
  unlocked: number // highest unlocked level id
}

const emptyProgress: Progress = { completed: [], bestMoves: {}, unlocked: 1 }

let cachedProgress: Progress | null = null
let cachedRaw: string | null = null

function loadProgress(): Progress {
  if (typeof window === 'undefined') return emptyProgress
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw && cachedProgress) return cachedProgress
    if (!raw) {
      cachedProgress = emptyProgress
      cachedRaw = null
      return emptyProgress
    }
    const p = JSON.parse(raw) as Partial<Progress>
    cachedProgress = {
      completed: p.completed ?? [],
      bestMoves: p.bestMoves ?? {},
      unlocked: p.unlocked ?? 1,
    }
    cachedRaw = raw
    return cachedProgress
  } catch {
    cachedProgress = emptyProgress
    cachedRaw = null
    return emptyProgress
  }
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    cachedRaw = null
    window.dispatchEvent(new Event('sokoban-progress-change'))
  } catch {
    /* ignore */
  }
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

// Calculate stars based on moves vs par
function calcStars(moves: number, par: number): 1 | 2 | 3 {
  if (moves <= par) return 3
  if (moves <= Math.ceil(par * 1.4)) return 2
  return 1
}

export default function Home() {
  const [screen, setScreen] = useState<'menu' | 'levels' | 'game'>('menu')
  const progress = useSyncExternalStore(
    subscribeProgress,
    loadProgress,
    () => emptyProgress
  )
  const [currentLevel, setCurrentLevel] = useState<number>(0)

  const startLevel = (idx: number) => {
    setCurrentLevel(idx)
    setScreen('game')
  }

  const handleWin = (levelId: number, moves: number) => {
    const prev = loadProgress()
    const completed = prev.completed.includes(levelId)
      ? prev.completed
      : [...prev.completed, levelId]
    const prevBest = prev.bestMoves[levelId]
    const bestMoves = {
      ...prev.bestMoves,
      [levelId]: prevBest == null ? moves : Math.min(prevBest, moves),
    }
    const unlocked = Math.max(prev.unlocked, Math.min(levelId + 1, LEVELS.length))
    saveProgress({ completed, bestMoves, unlocked })
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%, #020617 100%)',
        color: '#e2e8f0',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Tahoma, "Vazirmatn", sans-serif',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      dir="rtl"
    >
      {/* Animated background pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Floating glow orbs */}
      <div
        className="fixed top-[-10%] right-[-5%] w-72 h-72 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="fixed bottom-[-10%] left-[-5%] w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 w-full flex flex-col items-center min-h-screen">
        {screen === 'menu' && (
          <MenuScreen progress={progress} onPlay={() => setScreen('levels')} />
        )}

        {screen === 'levels' && (
          <LevelsScreen
            progress={progress}
            onBack={() => setScreen('menu')}
            onSelect={startLevel}
          />
        )}

        {screen === 'game' && (
          <GameScreen
            key={currentLevel}
            levelIndex={currentLevel}
            onMenu={() => setScreen('levels')}
            onNext={(idx) => startLevel(idx)}
            onWin={handleWin}
            totalLevels={LEVELS.length}
          />
        )}
      </div>
    </div>
  )
}

/* ============== MENU SCREEN ============== */
function MenuScreen({
  progress,
  onPlay,
}: {
  progress: Progress
  onPlay: () => void
}) {
  const completedCount = progress.completed.length
  const totalStars = Object.entries(progress.bestMoves).reduce((sum, [id, m]) => {
    const lvl = LEVELS.find((l) => l.id === Number(id))
    if (!lvl) return sum
    return sum + calcStars(m, lvl.par)
  }, 0)
  const pct = Math.round((completedCount / LEVELS.length) * 100)

  return (
    <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center px-6 py-10 gap-7">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-28 h-28 rounded-3xl flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
            boxShadow:
              '0 20px 50px rgba(220, 38, 38, 0.4), inset 0 -6px 0 rgba(0,0,0,0.2), inset 0 4px 0 rgba(255,255,255,0.2)',
          }}
        >
          <Boxes className="w-14 h-14 text-white" strokeWidth={2.5} />
          <div
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: '#fbbf24', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.5)' }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="text-center">
          <h1
            className="text-4xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            پازل جعبه‌چین
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            جعبه‌ها را به خانه برسان — فکر کن، هل بده، ببر!
          </p>
        </div>
      </div>

      {/* Stats dashboard */}
      <div className="w-full grid grid-cols-3 gap-3">
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          value={`${completedCount}`}
          label="مراحل طی شده"
          color="#10b981"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          value={`${totalStars}`}
          label="ستاره‌ها"
          color="#fbbf24"
        />
        <StatCard
          icon={<span className="text-base font-black">٪</span>}
          value={`${pct}`}
          label="پیشرفت"
          color="#a855f7"
        />
      </div>

      {/* Play button */}
      <Button
        onClick={onPlay}
        className="w-full h-16 text-xl font-black rounded-2xl border-0 relative overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
          color: 'white',
          boxShadow: '0 10px 30px rgba(220, 38, 38, 0.4)',
        }}
      >
        <span className="relative z-10 flex items-center gap-2">
          {completedCount > 0 ? 'ادامه بازی' : 'شروع بازی'}
          <ArrowLeft className="w-5 h-5" />
        </span>
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }}
        />
      </Button>

      {/* How to play */}
      <div className="w-full p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm text-sm space-y-3">
        <div className="font-bold text-amber-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          چگونه بازی کنیم؟
        </div>
        <div className="flex items-start gap-3 text-slate-300">
          <span className="w-7 h-7 shrink-0 rounded-lg bg-orange-500/20 flex items-center justify-center text-base">
            👆
          </span>
          <span className="leading-relaxed">
            با کشیدن انگشت روی صفحه یا دکمه‌های جهت‌نما حرکت کنید
          </span>
        </div>
        <div className="flex items-start gap-3 text-slate-300">
          <span className="w-7 h-7 shrink-0 rounded-lg bg-orange-500/20 flex items-center justify-center text-base">
            📦
          </span>
          <span className="leading-relaxed">
            جعبه‌های نارنجی را به سمت نقاط طلایی 🎯 برسانید
          </span>
        </div>
        <div className="flex items-start gap-3 text-slate-300">
          <span className="w-7 h-7 shrink-0 rounded-lg bg-rose-500/20 flex items-center justify-center text-base">
            ⚠️
          </span>
          <span className="leading-relaxed">
            مراقب باشید — جعبه‌ای که به گوشه می‌رود، گیر می‌کند!
          </span>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: string
  label: string
  color: string
}) {
  return (
    <div
      className="rounded-2xl p-3 flex flex-col items-center gap-1 backdrop-blur-sm"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      <div style={{ color }}>{icon}</div>
      <div className="text-xl font-black">{value}</div>
      <div className="text-[10px] text-slate-400 text-center leading-tight">{label}</div>
    </div>
  )
}

/* ============== LEVELS SCREEN ============== */
function LevelsScreen({
  progress,
  onBack,
  onSelect,
}: {
  progress: Progress
  onBack: () => void
  onSelect: (idx: number) => void
}) {
  return (
    <div className="flex-1 w-full max-w-md flex flex-col px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-slate-300 hover:text-white hover:bg-white/5"
        >
          <ArrowRight className="w-5 h-5 ml-1" />
          منو
        </Button>
        <h2 className="text-xl font-bold">انتخاب مرحله</h2>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-3 gap-3 overflow-y-auto pb-4">
        {LEVELS.map((lvl, idx) => {
          const unlocked = lvl.id <= progress.unlocked
          const completed = progress.completed.includes(lvl.id)
          const best = progress.bestMoves[lvl.id]
          const stars = best != null ? calcStars(best, lvl.par) : 0

          return (
            <button
              key={lvl.id}
              disabled={!unlocked}
              onClick={() => onSelect(idx)}
              className={`
                aspect-square rounded-2xl flex flex-col items-center justify-between
                p-2 transition-all duration-200 active:scale-95 relative
                ${unlocked ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-40'}
              `}
              style={{
                background: completed
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : unlocked
                  ? 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: completed
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : unlocked
                  ? '1px solid rgba(249, 115, 22, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: unlocked
                  ? completed
                    ? '0 6px 20px rgba(5, 150, 105, 0.35)'
                    : '0 6px 20px rgba(249, 115, 22, 0.3)'
                  : 'none',
              }}
            >
              {!unlocked ? (
                <div className="flex-1 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-slate-500" />
                </div>
              ) : (
                <>
                  <div className="text-[9px] text-white/70 font-medium mt-1">
                    {lvl.difficulty}
                  </div>
                  <div className="text-3xl font-black text-white">{lvl.id}</div>
                  <div className="flex gap-0.5 mb-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= stars
                            ? 'text-yellow-300 fill-yellow-300'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
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
function GameScreen({
  levelIndex,
  onMenu,
  onNext,
  onWin,
  totalLevels,
}: {
  levelIndex: number
  onMenu: () => void
  onNext: (idx: number) => void
  onWin: (levelId: number, moves: number) => void
  totalLevels: number
}) {
  const level = LEVELS[levelIndex]
  const parsed = useMemo(() => parseLevel(level.map), [level])
  const totalBoxes = useMemo(() => countBoxes(parsed), [parsed])

  const [player, setPlayer] = useState(parsed.player)
  const [boxes, setBoxes] = useState<boolean[][]>(() =>
    parsed.boxes.map((r) => [...r])
  )
  const [history, setHistory] = useState<HistoryStep[]>([])
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const [facing, setFacing] = useState<Dir>('down')
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'push'>('idle')
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const placedBoxes = useMemo(() => {
    let n = 0
    for (let y = 0; y < parsed.height; y++) {
      for (let x = 0; x < parsed.width; x++) {
        if (boxes[y][x] && parsed.goals[y][x]) n++
      }
    }
    return n
  }, [boxes, parsed])

  const tryMove = useCallback(
    (dir: Dir) => {
      if (won) return
      setFacing(dir)
      setPlayerAnim('push')
      setTimeout(() => setPlayerAnim('idle'), 150)

      const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
      const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0
      const nx = player.x + dx
      const ny = player.y + dy
      if (nx < 0 || ny < 0 || nx >= parsed.width || ny >= parsed.height) return
      if (parsed.walls[ny][nx]) return

      // box at (nx, ny)?
      if (boxes[ny][nx]) {
        const bx = nx + dx
        const by = ny + dy
        if (bx < 0 || by < 0 || bx >= parsed.width || by >= parsed.height) return
        if (parsed.walls[by][bx]) return
        if (boxes[by][bx]) return // box behind box

        // save history
        setHistory((h) => [
          ...h,
          { player: { ...player }, boxes: boxes.map((r) => [...r]), dir },
        ])
        const newBoxes = boxes.map((r) => [...r])
        newBoxes[ny][nx] = false
        newBoxes[by][bx] = true
        setBoxes(newBoxes)
        setPlayer({ x: nx, y: ny })
        setMoves((m) => m + 1)

        const updatedParsed: ParsedLevel = {
          ...parsed,
          boxes: newBoxes,
          player: { x: nx, y: ny },
        }
        if (isWin(updatedParsed)) {
          setWon(true)
          onWin(level.id, m + 1)
        }
      } else {
        setHistory((h) => [
          ...h,
          { player: { ...player }, boxes: boxes.map((r) => [...r]), dir },
        ])
        setPlayer({ x: nx, y: ny })
        setMoves((m) => m + 1)
      }
    },
    [player, boxes, parsed, won, level.id, onWin]
  )

  const undo = useCallback(() => {
    if (history.length === 0 || won) return
    const last = history[history.length - 1]
    setPlayer(last.player)
    setBoxes(last.boxes)
    setFacing(last.dir)
    setHistory((h) => h.slice(0, -1))
    setMoves((m) => Math.max(0, m - 1))
  }, [history, won])

  const reset = useCallback(() => {
    const p = parseLevel(level.map)
    setPlayer(p.player)
    setBoxes(p.boxes.map((r) => [...r]))
    setHistory([])
    setMoves(0)
    setWon(false)
    setFacing('down')
  }, [level.map])

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        tryMove('up')
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault()
        tryMove('down')
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        tryMove('left')
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        tryMove('right')
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        undo()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        reset()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tryMove, undo, reset])

  // touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    const threshold = 25
    if (absX < threshold && absY < threshold) return
    if (absX > absY) {
      tryMove(dx > 0 ? 'right' : 'left')
    } else {
      tryMove(dy > 0 ? 'down' : 'up')
    }
    touchStart.current = null
  }

  // responsive cell size
  const [actualCellSize, setActualCellSize] = useState(40)
  useEffect(() => {
    const calc = () => {
      const maxW = Math.min(window.innerWidth - 24, 440)
      const maxH = (window.innerHeight || 600) - 320
      const sizeByW = Math.floor(maxW / parsed.width)
      const sizeByH = Math.floor(maxH / parsed.height)
      setActualCellSize(Math.max(22, Math.min(58, Math.min(sizeByW, sizeByH))))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [parsed.width, parsed.height])

  const stars = won ? calcStars(moves, level.par) : 0

  return (
    <div className="flex-1 w-full max-w-md flex flex-col px-3 py-4 gap-3">
      {/* Top HUD */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenu}
          className="text-slate-300 hover:text-white hover:bg-white/5 shrink-0"
        >
          <MenuIcon className="w-5 h-5 ml-1" />
          مراحل
        </Button>
        <div className="flex flex-col items-center min-w-0">
          <div className="text-sm font-bold truncate">
            مرحله {level.id} — {level.name}
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span
              className="px-2 py-0.5 rounded-full"
              style={{
                background:
                  level.difficulty === 'آسان'
                    ? '#10b98120'
                    : level.difficulty === 'متوسط'
                    ? '#f59e0b20'
                    : level.difficulty === 'سخت'
                    ? '#ef444420'
                    : '#a855f720',
                color:
                  level.difficulty === 'آسان'
                    ? '#10b981'
                    : level.difficulty === 'متوسط'
                    ? '#f59e0b'
                    : level.difficulty === 'سخت'
                    ? '#ef4444'
                    : '#a855f7',
              }}
            >
              {level.difficulty}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-white/5 px-2.5 py-1.5 rounded-lg shrink-0">
          <Footprints className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-amber-400">{moves}</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400">{level.par}</span>
        </div>
      </div>

      {/* Board */}
      <div
        className="flex-1 flex items-center justify-center rounded-3xl overflow-hidden relative"
        style={{
          background:
            'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow:
            'inset 0 2px 8px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)',
          minHeight: 220,
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="relative"
          style={{
            width: parsed.width * actualCellSize,
            height: parsed.height * actualCellSize,
          }}
        >
          {/* Render tiles */}
          {Array.from({ length: parsed.height }).map((_, y) =>
            Array.from({ length: parsed.width }).map((_, x) => {
              const isWall = parsed.walls[y][x]
              const isGoal = parsed.goals[y][x]
              const isBox = boxes[y][x]
              const isPlayer = player.x === x && player.y === y
              const boxOnGoal = isBox && isGoal
              const checker = (x + y) % 2 === 0

              if (isWall) {
                return (
                  <div
                    key={`w-${x}-${y}`}
                    style={{
                      position: 'absolute',
                      left: x * actualCellSize,
                      top: y * actualCellSize,
                      width: actualCellSize,
                      height: actualCellSize,
                    }}
                  >
                    <WallTile size={actualCellSize} />
                  </div>
                )
              }

              return (
                <div
                  key={`f-${x}-${y}`}
                  style={{
                    position: 'absolute',
                    left: x * actualCellSize,
                    top: y * actualCellSize,
                    width: actualCellSize,
                    height: actualCellSize,
                    background: checker
                      ? 'rgba(148, 163, 184, 0.04)'
                      : 'rgba(148, 163, 184, 0.08)',
                  }}
                >
                  {/* Goal marker */}
                  {isGoal && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: actualCellSize * 0.25,
                        borderRadius: '50%',
                        border: `2px dashed rgba(251, 191, 36, 0.7)`,
                        background:
                          'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
                        animation: 'goalPulse 2s ease-in-out infinite',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: actualCellSize * 0.15,
                          borderRadius: '50%',
                          background: '#fbbf24',
                          opacity: 0.5,
                        }}
                      />
                    </div>
                  )}

                  {/* Box */}
                  {isBox && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: actualCellSize * 0.06,
                        transition:
                          'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transform: boxOnGoal ? 'scale(0.92)' : 'scale(1)',
                      }}
                    >
                      <CrateTile size={actualCellSize} onGoal={boxOnGoal} />
                    </div>
                  )}

                  {/* Player */}
                  {isPlayer && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: actualCellSize * 0.08,
                        transition: 'all 0.15s ease-out',
                        transform: playerAnim === 'push' ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <PlayerTile size={actualCellSize} facing={facing} />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Progress indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-amber-400">{placedBoxes}</span>
          <span className="text-slate-400">/{totalBoxes}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2.5">
        {/* D-pad */}
        <div
          dir="ltr"
          className="grid grid-cols-3 grid-rows-2 gap-2"
          style={{ width: 180 }}
        >
          <div />
          <DPadButton dir="up" onPress={() => tryMove('up')}>
            <ChevronUp className="w-7 h-7" strokeWidth={2.5} />
          </DPadButton>
          <div />
          <DPadButton dir="left" onPress={() => tryMove('left')}>
            <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
          </DPadButton>
          <DPadButton dir="down" onPress={() => tryMove('down')}>
            <ChevronDown className="w-7 h-7" strokeWidth={2.5} />
          </DPadButton>
          <DPadButton dir="right" onPress={() => tryMove('right')}>
            <ChevronRight className="w-7 h-7" strokeWidth={2.5} />
          </DPadButton>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={undo}
            disabled={history.length === 0 || won}
            className="flex-1 h-12 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25"
          >
            <Undo2 className="w-4 h-4 ml-1.5" />
            <span className="text-sm">برگشت</span>
            <span className="text-[10px] text-slate-500 mr-1.5">({history.length})</span>
          </Button>
          <Button
            variant="outline"
            onClick={reset}
            className="flex-1 h-12 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25"
          >
            <RotateCcw className="w-4 h-4 ml-1.5" />
            <span className="text-sm">شروع دوباره</span>
          </Button>
        </div>
      </div>

      {/* Win modal */}
      {won && (
        <WinModal
          level={level}
          moves={moves}
          stars={stars}
          hasNext={levelIndex + 1 < totalLevels}
          onMenu={onMenu}
          onNext={() => onNext(levelIndex + 1)}
        />
      )}

      <style jsx global>{`
        @keyframes goalPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes starPop {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.3) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes modalSlideIn {
          0% { transform: translateY(40px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* ============== TILES ============== */
function WallTile({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, #475569 0%, #1e293b 100%)',
        borderRadius: 4,
        boxShadow:
          'inset 0 -2px 0 rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.1), inset 2px 0 0 rgba(255,255,255,0.05)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 2,
          borderRadius: 3,
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
        }}
      />
    </div>
  )
}

function CrateTile({ size, onGoal }: { size: number; onGoal: boolean }) {
  const s = size
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: 6,
        background: onGoal
          ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
          : 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
        boxShadow: onGoal
          ? '0 4px 12px rgba(16, 185, 129, 0.5), inset 0 -3px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)'
          : '0 4px 12px rgba(217, 119, 6, 0.4), inset 0 -3px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Wood/crate planks */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: 0,
          right: 0,
          height: '8%',
          background: 'rgba(0,0,0,0.25)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '72%',
          left: 0,
          right: 0,
          height: '8%',
          background: 'rgba(0,0,0,0.25)',
        }}
      />
      {/* X bracing */}
      <svg
        width={s}
        height={s}
        style={{ position: 'absolute', inset: 0, opacity: 0.25 }}
        viewBox="0 0 100 100"
      >
        <line x1="10" y1="10" x2="90" y2="90" stroke="black" strokeWidth="3" />
        <line x1="90" y1="10" x2="10" y2="90" stroke="black" strokeWidth="3" />
      </svg>
      {/* Highlight */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '8%',
          right: '50%',
          bottom: '50%',
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
          borderRadius: 4,
        }}
      />
      {onGoal && (
        <div
          style={{
            position: 'absolute',
            inset: '30%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: s * 0.4,
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          ✓
        </div>
      )}
    </div>
  )
}

function PlayerTile({ size, facing }: { size: number; facing: Dir }) {
  const s = size
  const eyeOffset = {
    up: { x: 0, y: -2 },
    down: { x: 0, y: 1 },
    left: { x: -2, y: 0 },
    right: { x: 2, y: 0 },
  }[facing]

  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #60a5fa 0%, #1e40af 100%)',
        boxShadow:
          '0 5px 14px rgba(59, 130, 246, 0.5), inset 0 -4px 0 rgba(0,0,0,0.3), inset 0 3px 0 rgba(255,255,255,0.3)',
        position: 'relative',
        transition: 'transform 0.1s ease-out',
      }}
    >
      {/* Highlight */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: '40%',
          height: '35%',
          background:
            'radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      {/* Eyes */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '30%',
          width: '12%',
          height: '14%',
          background: 'white',
          borderRadius: '50%',
          transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '30%',
            width: '50%',
            height: '50%',
            background: '#0f172a',
            borderRadius: '50%',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: '38%',
          right: '30%',
          width: '12%',
          height: '14%',
          background: 'white',
          borderRadius: '50%',
          transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '30%',
            width: '50%',
            height: '50%',
            background: '#0f172a',
            borderRadius: '50%',
          }}
        />
      </div>
      {/* Smile */}
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          left: '35%',
          right: '35%',
          height: '12%',
          borderBottom: `2px solid rgba(15, 23, 42, 0.6)`,
          borderRadius: '0 0 50% 50%',
        }}
      />
    </div>
  )
}

function DPadButton({
  children,
  onPress,
  dir,
}: {
  children: React.ReactNode
  onPress: () => void
  dir: Dir
}) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault()
        onPress()
      }}
      className="aspect-square rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all duration-100 select-none"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.2)',
        minHeight: 44,
      }}
      aria-label={dir}
    >
      {children}
    </button>
  )
}

/* ============== WIN MODAL ============== */
function WinModal({
  level,
  moves,
  stars,
  hasNext,
  onMenu,
  onNext,
}: {
  level: (typeof LEVELS)[number]
  moves: number
  stars: 1 | 2 | 3
  hasNext: boolean
  onMenu: () => void
  onNext: () => void
}) {
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* Confetti */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: '-20px',
            width: 8,
            height: 14,
            background: colors[i % colors.length],
            animation: `confettiFall ${2 + Math.random() * 2}s linear ${Math.random() * 0.5}s infinite`,
            borderRadius: 2,
          }}
        />
      ))}

      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col items-center gap-4 text-center relative"
        style={{
          background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.6)',
          animation: 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Trophy */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            boxShadow: '0 10px 30px rgba(251, 191, 36, 0.5)',
          }}
        >
          <Trophy className="w-12 h-12 text-white" strokeWidth={2.5} />
        </div>

        <div>
          <h2 className="text-2xl font-black text-amber-400">آفرین!</h2>
          <p className="text-slate-300 text-sm mt-1">
            مرحله {level.id} — «{level.name}» را تمام کردید
          </p>
        </div>

        {/* Stars */}
        <div className="flex gap-2 justify-center my-1">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-12 h-12 ${
                s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'
              }`}
              style={{
                animation: s <= stars ? `starPop 0.5s ease-out ${s * 0.15}s both` : 'none',
                filter: s <= stars ? 'drop-shadow(0 4px 8px rgba(251, 191, 36, 0.5))' : 'none',
              }}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-3 w-full">
          <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 mb-1">حرکت شما</div>
            <div className="text-lg font-black text-amber-400">{moves}</div>
          </div>
          <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 mb-1">حداکثر برای ۳ ستاره</div>
            <div className="text-lg font-black text-slate-200">{level.par}</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 w-full mt-2">
          <Button
            variant="outline"
            onClick={onMenu}
            className="flex-1 h-12 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            مراحل
          </Button>
          {hasNext ? (
            <Button
              onClick={onNext}
              className="flex-1 h-12 rounded-xl border-0"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
                color: 'white',
                boxShadow: '0 6px 20px rgba(220, 38, 38, 0.35)',
              }}
            >
              مرحله بعد
              <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          ) : (
            <Button
              onClick={onMenu}
              className="flex-1 h-12 rounded-xl border-0"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Trophy className="w-4 h-4 ml-1" />
              پایان
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
