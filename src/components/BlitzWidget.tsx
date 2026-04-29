import { useEffect, useMemo, useState } from 'react';
import { GripHorizontal, ArrowLeft, CheckCircle2, Pause, Play, RotateCcw, Zap, Brain, Clock, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Task } from '../types';

// Dopamine-stacked task selection: quick wins first, build to complex
function selectBlitzQueue(tasks: Task[]): Task[] {
  const active = tasks.filter(t => t.status !== 'done');
  if (active.length === 0) return [];

  // Score each task
  const scored = active.map(t => {
    const impactScore = t.impact === 'high' ? 10 : t.impact === 'medium' ? 5 : 2;
    const targetBonus = t.isTarget ? 8 : 0;
    const urgencyScore = t.dueDate
      ? Math.max(0, 10 - Math.floor((new Date(t.dueDate).getTime() - Date.now()) / 86400000))
      : 0;
    // Prefer shorter tasks early (dopamine hit) but don't ignore big ones
    const quickScore = t.estimatedMinutes <= 15 ? 12 : t.estimatedMinutes <= 30 ? 4 : 0;
    return { task: t, score: impactScore + targetBonus + urgencyScore + quickScore };
  }).sort((a, b) => b.score - a.score);

  // Dopamine stack: start with quickest high-value tasks, build up
  const quick = scored.filter(s => s.task.estimatedMinutes <= 15).slice(0, 2).map(s => s.task);
  const medium = scored.filter(s => s.task.estimatedMinutes > 15 && s.task.estimatedMinutes <= 45 && !quick.includes(s.task)).slice(0, 1).map(s => s.task);
  const big = scored.filter(s => s.task.estimatedMinutes > 45 && !quick.includes(s.task) && !medium.includes(s.task)).slice(0, 1).map(s => s.task);

  // Order: quick wins → medium → big (dopamine escalation)
  const queue = [...quick, ...medium, ...big].slice(0, 3);
  // If we have fewer than 2 quick wins, fill from any tasks
  if (queue.length < 2) {
    const extras = scored.filter(s => !queue.includes(s.task)).slice(0, 2 - queue.length).map(s => s.task);
    queue.push(...extras);
  }
  return queue;
}

const CELEBRATIONS = [
  { emoji: '⚡', text: 'Done! Keep the momentum.', sub: 'Next task loaded.' },
  { emoji: '🔥', text: "That's what Blitz is about.", sub: "You're on fire." },
  { emoji: '✨', text: 'Great work!', sub: 'One task closer.' },
  { emoji: '💜', text: 'Done!', sub: 'Flow state achieved.' },
  { emoji: '🚀', text: 'Crushed it.', sub: 'Next up.' },
];

export function BlitzWidget() {
  const tasks        = useTaskStore(s => s.tasks);
  const loadTasks    = useTaskStore(s => s.loadTasks);
  const completeTask = useTaskStore(s => s.completeTask);
  const toggleBlitzMode = useTaskStore(s => s.toggleBlitzMode);
  const showCelebration = useSettingsStore(s => s.showBurstCelebration);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [timerActive, setTimerActive]   = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerMode, setTimerMode]       = useState<'focus' | 'break'>('focus');
  const [celebrating, setCelebrating]   = useState(false);
  const [celebIdx] = useState(() => Math.floor(Math.random() * CELEBRATIONS.length));
  const cel = CELEBRATIONS[celebIdx % CELEBRATIONS.length];

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const queue = useMemo(() => selectBlitzQueue(tasks), [tasks]);
  const current = queue[currentIdx] ?? null;

  // Reset index if queue shrinks
  useEffect(() => {
    if (currentIdx >= queue.length && queue.length > 0) setCurrentIdx(0);
  }, [queue.length, currentIdx]);

  // Countdown
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          setTimerMode(m => m === 'focus' ? 'break' : 'focus');
          return timerMode === 'focus' ? 5 * 60 : 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerActive, timerMode]);

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const total = timerMode === 'focus' ? 25*60 : 5*60;
  const circ  = 2 * Math.PI * 40;
  const offset = circ * (1 - timerSeconds/total);

  const handleComplete = async () => {
    if (!current) return;
    setCelebrating(true);
    await completeTask(current.id);
    setTimeout(() => { setCelebrating(false); setCurrentIdx(0); setTimerActive(false); setTimerSeconds(25*60); setTimerMode('focus'); }, 800);
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden select-none">
      {/* Drag header */}
      <div data-tauri-drag-region className="h-9 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
        <div data-tauri-drag-region className="flex items-center gap-2 text-muted/50">
          <GripHorizontal size={12} />
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">Blitz</span>
        </div>
        <button type="button" onClick={toggleBlitzMode}
          className="flex items-center gap-1 text-[10px] text-muted/40 hover:text-foreground transition-colors">
          <ArrowLeft size={10} /> Exit
        </button>
      </div>

      <main className="flex-1 flex flex-col px-5 py-4 gap-4 overflow-hidden relative">
        {/* Celebrate */}
        <AnimatePresence>
          {celebrating && showCelebration && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10 bg-black/90 backdrop-blur-sm rounded-2xl"
            >
              <div className="text-center">
                <motion.div
                  className="text-4xl mb-2"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  {cel.emoji}
                </motion.div>
                <div className="text-sm font-bold text-accent mb-0.5">{cel.text}</div>
                <div className="text-xs text-muted/50">{cel.sub}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {queue.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <Zap size={28} className="text-accent/20" />
            <p className="text-xs text-muted/40">No tasks queued</p>
            <p className="text-[10px] text-muted/25">Capture something to blitz</p>
          </div>
        ) : (
          <>
            {/* Task queue chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {queue.map((t, i) => {
                const label = t.estimatedMinutes <= 15 ? 'Quick' : t.estimatedMinutes <= 45 ? 'Focus' : 'Deep';
                const Icon = t.estimatedMinutes <= 15 ? Zap : t.estimatedMinutes <= 45 ? Brain : Target;
                return (
                  <button key={t.id} type="button"
                    onClick={() => { setCurrentIdx(i); setTimerActive(false); setTimerSeconds(25*60); setTimerMode('focus'); }}
                    data-tooltip={`${label} · ${t.estimatedMinutes}min`}
                    className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${i === currentIdx ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-white/[0.04] text-muted/50 border border-white/[0.05]'}`}>
                    <Icon size={9}/> {label}
                  </button>
                );
              })}
            </div>

            {/* Current task */}
            {current && (
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
                <div className="flex items-start gap-2 mb-2">
                  <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${current.impact === 'high' ? 'bg-accent' : current.impact === 'medium' ? 'bg-blue-400' : 'bg-muted/40'}`} />
                  <p className="text-sm font-medium text-foreground/90 leading-snug">{current.title}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted/50">
                  <span className="flex items-center gap-1"><Clock size={9}/>{current.estimatedMinutes}m</span>
                  <span className="capitalize">{current.impact} impact</span>
                  {current.estimatedMinutes <= 15 && <span className="text-accent/70">Quick Win 🏃</span>}
                  {current.estimatedMinutes > 45 && <span className="text-purple-400/70">Deep Work 🧠</span>}
                </div>
              </div>
            )}

            {/* Pomodoro ring */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
                <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                  <circle cx="48" cy="48" r="40" fill="none" stroke="var(--accent)" strokeWidth="3.5"
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 6px var(--accent))' }} />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-bold tabular-nums leading-none">{fmt(timerSeconds)}</span>
                  <span className="text-[8px] font-semibold uppercase tracking-widest text-muted/40 mt-0.5">{timerMode}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setTimerActive(false); setTimerMode('focus'); setTimerSeconds(25*60); }}
                  className="p-1.5 rounded-lg text-muted/40 hover:text-muted transition-colors"><RotateCcw size={12} /></button>
                <button type="button" onClick={() => setTimerActive(a => !a)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${timerActive ? 'bg-white/10 text-foreground' : 'bg-accent/20 text-accent border border-accent/30'}`}>
                  {timerActive ? <Pause size={11} /> : <Play size={11} />}
                  {timerActive ? 'Pause' : 'Focus'}
                </button>
              </div>
            </div>

            {/* Complete */}
            <button type="button" onClick={handleComplete}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-muted/40 hover:text-foreground hover:bg-white/[0.04] transition-all">
              <CheckCircle2 size={12} /> Mark Done
            </button>
          </>
        )}
      </main>
    </div>
  );
}
