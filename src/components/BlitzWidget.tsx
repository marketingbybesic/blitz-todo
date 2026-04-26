import { useEffect, useMemo, useState } from 'react';
import { GripHorizontal, ArrowLeft, Brain, Target, CheckCircle2, Play, Pause, RotateCcw } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function BlitzWidget() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const completeTask = useTaskStore((state) => state.completeTask);
  const toggleBlitzMode = useTaskStore((state) => state.toggleBlitzMode);

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          setTimerMode((m) => (m === 'focus' ? 'break' : 'focus'));
          return timerMode === 'focus' ? 5 * 60 : 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerMode]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const totalSeconds = timerMode === 'focus' ? 25 * 60 : 5 * 60;
  const circumference = 2 * Math.PI * 36;
  const progress = timerSeconds / totalSeconds;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const topTask = useMemo(() => {
    const deep = tasks.filter((t) => t.energyLevel === 'deep-work' && t.status !== 'done');
    if (deep.length === 0) return null;

    const score = (t: (typeof deep)[0]) => {
      let s = 0;
      if (t.isTarget) s += 10;
      s += t.impact === 'high' ? 3 : t.impact === 'medium' ? 2 : 1;
      return s;
    };

    return deep.sort((a, b) => score(b) - score(a))[0];
  }, [tasks]);

  return (
    <div className="min-h-[100dvh] md:h-screen w-screen bg-background flex flex-col overflow-hidden select-none">
      <header
        data-tauri-drag-region
        className="h-10 flex items-center justify-between px-4 bg-card/50 border-b border-border select-none cursor-default"
      >
        <div data-tauri-drag-region className="flex items-center gap-2 text-muted">
          <GripHorizontal size={14} />
          <span className="text-xs font-medium tracking-wide uppercase">Blitz</span>
        </div>
        <button
          type="button"
          onClick={toggleBlitzMode}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft size={12} />
          Exit Blitz Mode
        </button>
      </header>

      <main className="flex-1 flex flex-col p-5 gap-5">
        {topTask ? (
          <>
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-accent" />
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                Deep Work
              </span>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-medium text-foreground leading-snug">
                  {topTask.title}
                </h2>
                {topTask.isTarget && <Target size={14} className="text-accent shrink-0 mt-0.5" />}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span className="uppercase tracking-wider">{topTask.impact} Impact</span>
                <span className="tabular-nums">{topTask.estimatedMinutes}m</span>
              </div>
            </div>

            {/* Pomodoro Timer */}
            <div className="flex flex-col items-center gap-3">
              {/* Circular progress ring */}
              <div className="relative flex items-center justify-center w-24 h-24">
                <svg width="96" height="96" className="-rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-border"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="text-accent transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold tabular-nums text-foreground leading-none">
                    {formatTime(timerSeconds)}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-muted mt-0.5">
                    {timerMode}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTimerActive(false);
                    setTimerMode('focus');
                    setTimerSeconds(25 * 60);
                  }}
                  className="p-2 rounded-md text-muted hover:text-foreground hover:bg-card/5 transition-all"
                  aria-label="Reset timer"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setTimerActive((a) => !a)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium border border-accent/30 text-accent hover:bg-accent hover:text-background transition-all"
                >
                  {timerActive ? <Pause size={13} /> : <Play size={13} />}
                  {timerActive ? 'Pause' : 'Start Focus'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => completeTask(topTask.id)}
              className="w-full py-2 rounded-md text-xs font-medium text-white/40 hover:text-white hover:bg-card/5 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={12} />
              Mark Complete
            </button>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
            <Brain size={20} className="text-white/10" />
            <p className="text-xs text-muted">No deep work tasks</p>
            <p className="text-[11px] text-white/25">Capture one to begin</p>
          </div>
        )}
      </main>
    </div>
  );
}
