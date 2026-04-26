import { useEffect, useMemo } from 'react';
import { GripHorizontal, ArrowLeft, Brain, Target, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function BlitzWidget() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const completeTask = useTaskStore((state) => state.completeTask);
  const toggleBlitzMode = useTaskStore((state) => state.toggleBlitzMode);

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

            <button
              type="button"
              className="w-full py-2 rounded-md text-xs font-medium border border-accent/30 text-accent hover:bg-accent hover:text-white transition-all"
            >
              Start Focus
            </button>

            <button
              type="button"
              onClick={() => completeTask(topTask.id)}
              className="w-full py-2 rounded-md text-xs font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
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
