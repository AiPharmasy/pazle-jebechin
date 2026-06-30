'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import {
  LEVELS,
  ParsedLevel,
  parseLevel,
  isWin,
} from '@/lib/levels'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Undo2,
  RotateCcw,
  Menu,
  Trophy,
  Lock,
  Star,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

type Dir = 'up' | 'down' | 'left' | 'right'

interface HistoryStep {
  player: { x: number; y: number }
  boxes: boolean[][]
}

const STORAGE_KEY = 'sokoban_progress_v1'

interface Progress {
  completed: number[] // level ids
  unlocked: number // highest unlocked level id
}

const emptyProgress: Progress = { completed: [], unlocked: 1 }

let cachedProgress: Progress | null = null
let cachedRaw: string | null = null

function loadProgress(): Progress {
  if (typeof window === 'undefined') return emptyProgress
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // Cache: return same reference if raw hasn't changed
    if (raw === cachedRaw && cachedProgress) return cachedProgress
    if (!raw) {
      cachedRaw = null
      cachedProgress = emptyProgress
      return emptyProgress
    }
    const p = JSON.parse(raw) as Progress
    cachedProgress = { completed: p.completed ?? [], unlocked: p.unlocked ?? 1 }
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
    cachedRaw = null // invalidate cache so next read picks up new value
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

export default function Home() {
  const [screen, setScreen] = useState<'menu' | 'levels' | 'game'>('menu')
  const progress = useSyncExternalStore(subscribeProgress, loadProgress, () => emptyProgress)
  const [currentLevel, setCurrentLevel] = useState<number>(0) // index into LEVELS

  const startLevel = (idx: number) => {
    setCurrentLevel(idx)
    setScreen('game')
  }

  const handleWin = (levelId: number) => {
    const prev = loadProgress()
    const completed = prev.completed.includes(levelId)
      ? prev.completed
      : [...prev.completed, levelId]
    const unlocked = Math.max(prev.unlocked, Math.min(levelId + 1, LEVELS.length))
    saveProgress({ completed, unlocked })
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start"
      style={{
        background: 'linear-gradient(160deg, #1a1f2e 0%, #0f1419 50%, #1a1f2e 100%)',
        color: '#e8eaed',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      dir="rtl"
    >
      {screen === 'menu' && (
        <MenuScreen
          progress={progress}
          onPlay={() => setScreen('levels')}
        />
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
  const totalStars = completedCount * 3
  const pct = Math.round((completedCount / LEVELS.length) * 100)

  return (
    <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center px-6 py-10 gap-8">
      {/* Logo / Title */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            boxShadow: '0 12px 40px rgba(245, 158, 11, 0.4)',
          }}
        >
          📦
        </div>
        <h1
          className="text-4xl font-black text-center"
          style={{ letterSpacing: '-0.02em' }}
        >
          پازل جعبه‌چین
        </h1>
        <p className="text-sm text-gray-400 text-center">
          جعبه‌ها را به سمت اهداف هل بدهید!
        </p>
      </div>

      {/* Stats */}
      <div className="w-full grid grid-cols-3 gap-3">
        <StatCard icon={<Trophy className="w-5 h-5" />} value={`${completedCount}`} label="مراحل طی شده" />
        <StatCard icon={<Star className="w-5 h-5" />} value={`${totalStars}`} label="ستاره‌ها" />
        <StatCard icon={<span className="text-base font-bold">٪</span>} value={`${pct}`} label="پیشرفت" />
      </div>

      {/* Play button */}
      <Button
        onClick={onPlay}
        className="w-full h-16 text-xl font-bold rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.35)',
        }}
      >
        {completedCount > 0 ? 'ادامه بازی' : 'شروع بازی'}
      </Button>

      {/* How to play */}
      <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-sm space-y-2">
        <div className="font-bold text-amber-400 mb-2">چگونه بازی کنیم؟</div>
        <div className="flex items-center gap-2 text-gray-300">
          <span className="text-lg">👆</span>
          <span>با کشیدن انگشت روی صفحه حرکت کنید</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <span className="text-lg">📦</span>
          <span>جعبه‌ها را به سمت نقاط طلایی برسانید</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <span className="text-lg">⚠️</span>
          <span>جعبه‌ها فقط هل داده می‌شوند، کشیده نمی‌شوند</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="rounded-2xl p-3 flex flex-col items-center gap-1 bg-white/5 border border-white/10">
      <div className="text-amber-400">{icon}</div>
      <div className="text-lg font-black">{value}</div>
      <div className="text-[10px] text-gray-400 text-center leading-tight">{label}</div>
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
          className="text-gray-300 hover:text-white"
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
          return (
            <button
              key={lvl.id}
              disabled={!unlocked}
              onClick={() => onSelect(idx)}
              className={`
                aspect-square rounded-2xl flex flex-col items-center justify-center gap-1
                transition-all active:scale-95
                ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}
              `}
              style={{
                background: completed
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : unlocked
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: completed
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: unlocked && !completed
                  ? '0 4px 16px rgba(245, 158, 11, 0.25)'
                  : completed
                  ? '0 4px 16px rgba(16, 185, 129, 0.25)'
                  : 'none',
              }}
            >
              {!unlocked ? (
                <Lock className="w-6 h-6 text-gray-500" />
              ) : (
                <>
                  <div className="text-2xl font-black text-white">{lvl.id}</div>
                  {completed && <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />}
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
  onWin: (levelId: number) => void
  totalLevels: number
}) {
  const level = LEVELS[levelIndex]
  const parsed = useMemo(() => parseLevel(level.map), [level])
  const [player, setPlayer] = useState(parsed.player)
  const [boxes, setBoxes] = useState<boolean[][]>(() => parsed.boxes.map((r) => [...r]))
  const [history, setHistory] = useState<HistoryStep[]>([])
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const tryMove = useCallback(
    (dir: Dir) => {
      if (won) return
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
          { player: { ...player }, boxes: boxes.map((r) => [...r]) },
        ])
        // move box
        const newBoxes = boxes.map((r) => [...r])
        newBoxes[ny][nx] = false
        newBoxes[by][bx] = true
        setBoxes(newBoxes)
        setPlayer({ x: nx, y: ny })
        setMoves((m) => m + 1)

        // check win
        const updatedParsed: ParsedLevel = {
          ...parsed,
          boxes: newBoxes,
          player: { x: nx, y: ny },
        }
        if (isWin(updatedParsed)) {
          setWon(true)
          onWin(level.id)
        }
      } else {
        // simple move
        setHistory((h) => [
          ...h,
          { player: { ...player }, boxes: boxes.map((r) => [...r]) },
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
  }, [level.map])

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault()
        tryMove('up')
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault()
        tryMove('down')
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault()
        tryMove('left')
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault()
        tryMove('right')
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        undo()
      } else if (e.key === 'r') {
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

  const cellSize = useMemo(() => {
    // responsive: based on viewport
    if (typeof window === 'undefined') return 40
    const maxW = Math.min(window.innerWidth - 32, 460)
    const maxH = (window.innerHeight || 600) - 280
    const sizeByW = Math.floor(maxW / parsed.width)
    const sizeByH = Math.floor(maxH / parsed.height)
    return Math.max(24, Math.min(64, Math.min(sizeByW, sizeByH)))
  }, [parsed.width, parsed.height])

  const [actualCellSize, setActualCellSize] = useState(40)
  useEffect(() => {
    const calc = () => {
      const maxW = Math.min(window.innerWidth - 32, 460)
      const maxH = (window.innerHeight || 600) - 280
      const sizeByW = Math.floor(maxW / parsed.width)
      const sizeByH = Math.floor(maxH / parsed.height)
      setActualCellSize(Math.max(24, Math.min(64, Math.min(sizeByW, sizeByH))))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [parsed.width, parsed.height])

  return (
    <div className="flex-1 w-full max-w-md flex flex-col px-3 py-4 gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenu}
          className="text-gray-300 hover:text-white"
        >
          <Menu className="w-5 h-5 ml-1" />
          مراحل
        </Button>
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold">
            مرحله {level.id} — {level.name}
          </div>
          <div className="text-xs text-amber-400">{level.difficulty}</div>
        </div>
        <div className="flex items-center gap-1 text-sm bg-white/5 px-3 py-1 rounded-lg">
          <span className="text-gray-400">حرکت:</span>
          <span className="font-bold text-amber-400">{moves}</span>
        </div>
      </div>

      {/* Board */}
      <div
        className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #2a3142 0%, #1c2230 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          minHeight: 240,
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
          {/* Render cells */}
          {Array.from({ length: parsed.height }).map((_, y) =>
            Array.from({ length: parsed.width }).map((_, x) => {
              const isWall = parsed.walls[y][x]
              const isGoal = parsed.goals[y][x]
              const isBox = boxes[y][x]
              const isPlayer = player.x === x && player.y === y
              const boxOnGoal = isBox && isGoal

              if (isWall) {
                return (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      position: 'absolute',
                      left: x * actualCellSize,
                      top: y * actualCellSize,
                      width: actualCellSize,
                      height: actualCellSize,
                      background: 'linear-gradient(145deg, #4a5568 0%, #2d3748 100%)',
                      borderRadius: 4,
                      boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.3)',
                    }}
                  />
                )
              }

              return (
                <div
                  key={`${x}-${y}`}
                  style={{
                    position: 'absolute',
                    left: x * actualCellSize,
                    top: y * actualCellSize,
                    width: actualCellSize,
                    height: actualCellSize,
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  {/* Goal marker */}
                  {isGoal && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: actualCellSize * 0.3,
                        borderRadius: '50%',
                        background:
                          'radial-gradient(circle, rgba(245, 158, 11, 0.9) 0%, rgba(245, 158, 11, 0.3) 70%)',
                        boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
                      }}
                    />
                  )}

                  {/* Box */}
                  {isBox && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: actualCellSize * 0.08,
                        borderRadius: 6,
                        background: boxOnGoal
                          ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
                          : 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
                        boxShadow: boxOnGoal
                          ? '0 4px 12px rgba(16, 185, 129, 0.5), inset 0 -3px 0 rgba(0,0,0,0.25)'
                          : '0 4px 12px rgba(217, 119, 6, 0.4), inset 0 -3px 0 rgba(0,0,0,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: actualCellSize * 0.5,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <span style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}>
                        {boxOnGoal ? '✓' : '📦'}
                      </span>
                    </div>
                  )}

                  {/* Player */}
                  {isPlayer && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: actualCellSize * 0.1,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                        boxShadow:
                          '0 4px 12px rgba(59, 130, 246, 0.5), inset 0 -3px 0 rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: actualCellSize * 0.5,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <span style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}>😊</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2">
        {/* D-pad — fixed LTR so arrows always match world directions */}
        <div dir="ltr" className="grid grid-cols-3 grid-rows-2 gap-2 w-48">
          <div />
          <DPadButton dir="up" onPress={() => tryMove('up')}>
            <ChevronUp className="w-6 h-6" />
          </DPadButton>
          <div />
          <DPadButton dir="left" onPress={() => tryMove('left')}>
            <ChevronLeft className="w-6 h-6" />
          </DPadButton>
          <DPadButton dir="down" onPress={() => tryMove('down')}>
            <ChevronDown className="w-6 h-6" />
          </DPadButton>
          <DPadButton dir="right" onPress={() => tryMove('right')}>
            <ChevronRight className="w-6 h-6" />
          </DPadButton>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={undo}
            disabled={history.length === 0}
            className="flex-1 h-11 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            <Undo2 className="w-4 h-4 ml-1" />
            برگشت
          </Button>
          <Button
            variant="outline"
            onClick={reset}
            className="flex-1 h-11 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4 ml-1" />
            شروع دوباره
          </Button>
        </div>
      </div>

      {/* Win modal */}
      {won && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 flex flex-col items-center gap-4 text-center"
            style={{
              background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="text-6xl animate-bounce">🎉</div>
            <h2 className="text-2xl font-black text-amber-400">آفرین!</h2>
            <p className="text-gray-300 text-sm">
              مرحله {level.id} را با {moves} حرکت تمام کردید
            </p>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-7 h-7 ${
                    s <= 3 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2 w-full mt-2">
              <Button
                variant="outline"
                onClick={onMenu}
                className="flex-1 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                مراحل
              </Button>
              {levelIndex + 1 < totalLevels ? (
                <Button
                  onClick={() => onNext(levelIndex + 1)}
                  className="flex-1 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  مرحله بعد
                  <ArrowLeft className="w-4 h-4 mr-1" />
                </Button>
              ) : (
                <Button
                  onClick={onMenu}
                  className="flex-1 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  <Trophy className="w-4 h-4 ml-1" />
                  پایان
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
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
      className="aspect-square rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform select-none"
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        minHeight: 44,
      }}
      aria-label={dir}
    >
      {children}
    </button>
  )
}
