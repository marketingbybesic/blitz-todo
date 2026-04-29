import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Circle, CheckCircle, Brain, Zap, Trash2, Calendar, MapPin,
  ListChecks, Eye, EyeOff, Clock, Target, Edit3, ArrowRight,
  Sun, Sunset, Coffee, ChevronRight, Flag, Copy,
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Task } from '../types';
import { TimeTracker } from './TimeTracker';

interface TaskItemProps { task: Task; onComplete: (id: string) => Promise<void>; }

const IMPACT_ACCENT: Record<string, string> = {
  high:   'text-accent',
  medium: 'text-blue-400',
  low:    'text-muted/50',
};
const STATUS_BORDER: Record<string, string> = {
  todo:        'border-l-transparent',
  in_progress: 'border-l-orange-400/50',
  done:        'border-l-green-400/30',
};

const LONG_PRESS_MS = 500;

interface CtxPos { x: number; y: number }

export function TaskItem({ task, onComplete }: TaskItemProps) {
  const [completing,      setCompleting]      = useState(false);
  const [peeking,         setPeeking]         = useState(false);
  const [ctxMenu,         setCtxMenu]         = useState<CtxPos | null>(null);
  const [subMenu,         setSubMenu]         = useState<'priority' | 'reschedule' | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);

  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressOrigin = useRef<CtxPos>({ x: 0, y: 0 });

  const setSelectedTaskId = useTaskStore(s => s.setSelectedTaskId);
  const deleteTask        = useTaskStore(s => s.deleteTask);
  const updateTask        = useTaskStore(s => s.updateTask);
  const addTask           = useTaskStore(s => s.addTask);
  const zones             = useTaskStore(s => s.zones);
  const zone = zones.find(z => z.id === task.zoneId);
  const EnergyIcon = task.energyLevel === 'deep-work' ? Brain : Zap;

  // ── Complete ──────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    setCompleting(true);
    setTimeout(() => onComplete(task.id), 600);
  }, [task.id, onComplete]);

  // ── Context menu ──────────────────────────────────────────
  const openCtx = useCallback((x: number, y: number) => {
    setSubMenu(null);
    setCtxMenu({ x, y });
  }, []);

  const closeCtx = useCallback(() => {
    setCtxMenu(null);
    setSubMenu(null);
  }, []);

  const handleCtxClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openCtx(e.clientX, e.clientY);
  }, [openCtx]);

  // ── Long press ────────────────────────────────────────────
  const startLongPress = useCallback((clientX: number, clientY: number) => {
    longPressOrigin.current = { x: clientX, y: clientY };
    longPressTimer.current = setTimeout(() => {
      setLongPressActive(true);
      if (navigator.vibrate) navigator.vibrate(30);
      openCtx(longPressOrigin.current.x, longPressOrigin.current.y);
    }, LONG_PRESS_MS);
  }, [openCtx]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    setLongPressActive(false);
  }, []);

  // ── Actions ───────────────────────────────────────────────
  const reschedule = useCallback(async (days: number | null) => {
    if (days === null) {
      await updateTask(task.id, { dueDate: undefined });
    } else {
      const d = new Date(); d.setDate(d.getDate() + days); d.setHours(9, 0, 0, 0);
      await updateTask(task.id, { dueDate: d.toISOString() });
    }
    closeCtx();
  }, [task.id, updateTask, closeCtx]);

  const setPriority = useCallback(async (impact: Task['impact']) => {
    await updateTask(task.id, { impact });
    closeCtx();
  }, [task.id, updateTask, closeCtx]);

  const duplicate = useCallback(async () => {
    await addTask({
      title: `${task.title} (copy)`, energyLevel: task.energyLevel,
      estimatedMinutes: task.estimatedMinutes, isTarget: false, status: 'todo',
      impact: task.impact, dueDate: task.dueDate, content: task.content,
      zoneId: task.zoneId, startDate: task.startDate, checklist: [],
    });
    closeCtx();
  }, [task, addTask, closeCtx]);

  const toggleStatus = useCallback(async () => {
    const next: Task['status'] = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    await updateTask(task.id, { status: next });
    closeCtx();
  }, [task.id, task.status, updateTask, closeCtx]);

  // ── Smart menu position ───────────────────────────────────
  const menuPos = ctxMenu ? (() => {
    const menuH = subMenu ? 240 : 280;
    return {
      top:  ctxMenu.y + menuH > window.innerHeight ? ctxMenu.y - menuH : ctxMenu.y + 4,
      left: ctxMenu.x + 216 > window.innerWidth   ? ctxMenu.x - 216   : ctxMenu.x + 4,
    };
  })() : null;

  const STATUS_LABEL: Record<Task['status'], string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  const NEXT_STATUS:  Record<Task['status'], string> = { todo: 'In Progress', in_progress: 'Done', done: 'To Do' };

  return (
    <>
      <div
        className={`group relative flex flex-col border-l-2 pl-3 py-2 pr-2 rounded-r-lg
          hover:bg-white/[0.025] cursor-pointer select-none
          ${STATUS_BORDER[task.status] ?? 'border-l-transparent'}
          ${completing      ? 'opacity-30 scale-95 duration-500' : 'transition-all duration-150'}
          ${longPressActive ? 'scale-[0.98] bg-white/[0.04]' : ''}
        `}
        onClick={() => setSelectedTaskId(task.id)}
        onContextMenu={handleCtxClick}
        onMouseDown={e => { if (e.button === 0) startLongPress(e.clientX, e.clientY); }}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={e => { const t = e.touches[0]; startLongPress(t.clientX, t.clientY); }}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        draggable
        onDragStart={e => { cancelLongPress(); e.dataTransfer.setData('taskId', task.id); e.dataTransfer.effectAllowed = 'move'; }}
      >
        {/* Completion sweep */}
        {completing && (
          <motion.div className="absolute inset-0 rounded-r-lg"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
            initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
        )}

        {/* Long press ring */}
        {longPressActive && (
          <motion.div className="absolute inset-0 rounded-r-lg pointer-events-none"
            style={{ border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        )}

        <div className="flex items-center gap-2.5 relative z-10">
          <button type="button" onClick={e => { e.stopPropagation(); handleComplete(); }}
            className="flex-shrink-0 text-muted/30 hover:text-accent transition-colors">
            {completing ? <CheckCircle size={16} className="text-accent" /> : <Circle size={16} className="group-hover:text-muted/60 transition-colors" />}
          </button>

          <span className={`flex-1 text-sm leading-snug ${completing ? 'line-through text-muted/40' : task.status === 'done' ? 'line-through text-muted/30' : 'text-foreground/90'}`}>
            {task.title}
          </span>

          <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
            {task.checklist?.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted/50">
                <ListChecks size={10} />{task.checklist.filter(i => i.isDone).length}/{task.checklist.length}
              </span>
            )}
            <EnergyIcon size={12} className="text-muted/40" />
            <span className={`text-[10px] font-semibold ${IMPACT_ACCENT[task.impact ?? 'medium']}`}>{task.estimatedMinutes}m</span>
            <TimeTracker taskId={task.id} compact />
            <button type="button" onClick={e => { e.stopPropagation(); setPeeking(p => !p); }}
              className="text-muted/30 hover:text-muted/70 transition-colors">
              {peeking ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        </div>

        {/* Peek details */}
        <AnimatePresence>
          {peeking && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden relative z-10 ml-6">
              <div className="flex items-center gap-3 pt-2 text-[10px] text-muted/50 flex-wrap">
                {zone && <span className="flex items-center gap-1"><MapPin size={9} />{zone.name}</span>}
                {task.dueDate && <span className="flex items-center gap-1"><Calendar size={9} />{new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
                <span className="flex items-center gap-1"><Clock size={9} />{task.estimatedMinutes}m</span>
                <span className={`capitalize font-semibold ${IMPACT_ACCENT[task.impact ?? 'medium']}`}>{task.impact} impact</span>
                {task.isTarget && <span className="flex items-center gap-1 text-accent/70"><Target size={9} />Target</span>}
                <span className="capitalize text-muted/30">{task.status.replace('_', ' ')}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Context menu ──────────────────────────────────────── */}
      <AnimatePresence>
        {ctxMenu && menuPos && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.08 }}
              className="fixed inset-0 z-[90]" onClick={closeCtx} onContextMenu={e => { e.preventDefault(); closeCtx(); }} />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={{ type: 'spring', stiffness: 600, damping: 36 }}
              className="fixed z-[100] w-52 bg-black/95 backdrop-blur-2xl rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden"
              style={{ ...menuPos, border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-3 pt-3 pb-2">
                <p className="text-[11px] font-bold text-foreground/80 truncate">{task.title}</p>
                <p className="text-[10px] text-muted/40 mt-0.5">{STATUS_LABEL[task.status]} · {task.impact} impact</p>
              </div>
              <div className="border-t border-white/[0.05] mx-2" />

              {/* Main */}
              {subMenu === null && (
                <div className="py-1.5 px-1">
                  <CtxBtn icon={<CheckCircle size={13} />} label="Mark Complete" color="text-green-400"
                    onClick={() => { onComplete(task.id); closeCtx(); }} />
                  <CtxBtn icon={<ArrowRight size={13} />} label={`→ ${NEXT_STATUS[task.status]}`} onClick={toggleStatus} />
                  <CtxBtn icon={<Edit3 size={13} />} label="Edit Details"
                    onClick={() => { setSelectedTaskId(task.id); closeCtx(); }} />
                  <div className="border-t border-white/[0.04] mx-2 my-1" />
                  <CtxBtn icon={<Calendar size={13} />} label="Reschedule"
                    right={<ChevronRight size={11} className="text-muted/30" />}
                    onClick={() => setSubMenu('reschedule')} />
                  <CtxBtn icon={<Flag size={13} />} label="Set Priority"
                    right={<ChevronRight size={11} className="text-muted/30" />}
                    onClick={() => setSubMenu('priority')} />
                  <CtxBtn icon={<Copy size={13} />} label="Duplicate" onClick={duplicate} />
                  <div className="border-t border-white/[0.04] mx-2 my-1" />
                  <CtxBtn icon={<Trash2 size={13} />} label="Delete" color="text-red-400/80"
                    onClick={() => { deleteTask(task.id); closeCtx(); }} />
                </div>
              )}

              {/* Reschedule submenu */}
              {subMenu === 'reschedule' && (
                <div className="py-1.5 px-1">
                  <CtxBtn icon={<ChevronRight size={11} className="rotate-180" />} label="Back" color="text-muted/50" onClick={() => setSubMenu(null)} />
                  <div className="border-t border-white/[0.04] mx-2 my-1" />
                  <CtxBtn icon={<Sun size={13} />}      label="Today"        onClick={() => reschedule(0)} />
                  <CtxBtn icon={<Sunset size={13} />}   label="Tomorrow"     onClick={() => reschedule(1)} />
                  <CtxBtn icon={<Coffee size={13} />}   label="This Weekend" onClick={() => reschedule(6 - new Date().getDay() || 7)} />
                  <CtxBtn icon={<Calendar size={13} />} label="Next Week"    onClick={() => reschedule(7)} />
                  <CtxBtn icon={<Calendar size={13} />} label="In 2 Weeks"   onClick={() => reschedule(14)} />
                  <div className="border-t border-white/[0.04] mx-2 my-1" />
                  <CtxBtn icon={<Trash2 size={11} />} label="Clear Due Date" color="text-muted/40" onClick={() => reschedule(null)} />
                </div>
              )}

              {/* Priority submenu */}
              {subMenu === 'priority' && (
                <div className="py-1.5 px-1">
                  <CtxBtn icon={<ChevronRight size={11} className="rotate-180" />} label="Back" color="text-muted/50" onClick={() => setSubMenu(null)} />
                  <div className="border-t border-white/[0.04] mx-2 my-1" />
                  <CtxBtn icon={<Flag size={13} />} label="High Impact" color={task.impact === 'high' ? 'text-accent' : 'text-accent/50'}
                    right={task.impact === 'high' ? <CheckCircle size={11} className="text-accent" /> : undefined}
                    onClick={() => setPriority('high')} />
                  <CtxBtn icon={<Flag size={13} />} label="Medium Impact" color={task.impact === 'medium' ? 'text-blue-400' : 'text-blue-400/50'}
                    right={task.impact === 'medium' ? <CheckCircle size={11} className="text-blue-400" /> : undefined}
                    onClick={() => setPriority('medium')} />
                  <CtxBtn icon={<Flag size={13} />} label="Low Impact" color={task.impact === 'low' ? 'text-muted' : 'text-muted/40'}
                    right={task.impact === 'low' ? <CheckCircle size={11} className="text-muted" /> : undefined}
                    onClick={() => setPriority('low')} />
                </div>
              )}

              <div className="px-3 py-1.5 border-t border-white/[0.04]">
                <p className="text-[9px] text-muted/20">Right-click or hold to open</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function CtxBtn({ icon, label, color = 'text-foreground/70', right, onClick }: {
  icon: React.ReactNode; label: string; color?: string;
  right?: React.ReactNode; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] transition-colors text-xs ${color}`}>
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {right && <span className="flex-shrink-0">{right}</span>}
    </button>
  );
}
