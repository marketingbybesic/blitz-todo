import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, CheckCircle, Brain, Zap, Trash2, Calendar, MapPin, ListChecks, Eye, EyeOff, Clock, Target, Edit3, ArrowRight } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Task } from '../types';

interface TaskItemProps { task: Task; onComplete: (id: string) => void; }

// Status-aware accent colors
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

export function TaskItem({ task, onComplete }: TaskItemProps) {
  const [completing, setCompleting] = useState(false);
  const [peeking,    setPeeking]    = useState(false);
  const [ctxMenu,    setCtxMenu]    = useState<{ x: number; y: number } | null>(null);

  const setSelectedTaskId = useTaskStore(s => s.setSelectedTaskId);
  const deleteTask        = useTaskStore(s => s.deleteTask);
  const updateTask        = useTaskStore(s => s.updateTask);
  const zones             = useTaskStore(s => s.zones);
  const zone = zones.find(z => z.id === task.zoneId);

  const EnergyIcon = task.energyLevel === 'deep-work' ? Brain : Zap;

  const handleComplete = () => {
    setCompleting(true);
    setTimeout(() => onComplete(task.id), 600);
  };

  const handleCtx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  const handleReschedule = async (days: number) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    await updateTask(task.id, { dueDate: d.toISOString() });
    setCtxMenu(null);
  };

  return (
    <>
      <div
        className={`group relative flex flex-col border-l-2 pl-3 py-2 pr-2 rounded-r-lg hover:bg-white/[0.025] transition-colors cursor-pointer ${STATUS_BORDER[task.status] ?? 'border-l-transparent'} ${completing ? 'opacity-30 scale-95' : ''} transition-all duration-500`}
        onClick={() => setSelectedTaskId(task.id)}
        onContextMenu={handleCtx}
        draggable
        onDragStart={e => { e.dataTransfer.setData('taskId', task.id); e.dataTransfer.effectAllowed = 'move'; }}
      >
        {/* Completion sweep */}
        {completing && (
          <motion.div className="absolute inset-0 rounded-r-lg"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }} />
        )}

        <div className="flex items-center gap-2.5 relative z-10">
          {/* Complete button */}
          <button type="button" onClick={e => { e.stopPropagation(); handleComplete(); }}
            className="flex-shrink-0 text-muted/30 hover:text-accent transition-colors">
            {completing
              ? <CheckCircle size={16} className="text-accent" />
              : <Circle size={16} className="group-hover:text-muted/60 transition-colors" />}
          </button>

          {/* Title */}
          <span className={`flex-1 text-sm leading-snug ${completing ? 'line-through text-muted/40' : task.status === 'done' ? 'line-through text-muted/30' : 'text-foreground/90'}`}>
            {task.title}
          </span>

          {/* Meta row — hidden until hover on mobile */}
          <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
            {task.checklist?.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted/50">
                <ListChecks size={10} />
                {task.checklist.filter(i=>i.isDone).length}/{task.checklist.length}
              </span>
            )}
            <EnergyIcon size={12} className="text-muted/40" />
            <span className={`text-[10px] font-semibold ${IMPACT_ACCENT[task.impact ?? 'medium']}`}>
              {task.estimatedMinutes}m
            </span>
            <button type="button" onClick={e => { e.stopPropagation(); setPeeking(p=>!p); }}
              className="text-muted/30 hover:text-muted/70 transition-colors">
              {peeking ? <EyeOff size={12}/> : <Eye size={12}/>}
            </button>
          </div>
        </div>

        {/* Peek details */}
        <AnimatePresence>
          {peeking && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
              className="overflow-hidden relative z-10 ml-6">
              <div className="flex items-center gap-3 pt-2 text-[10px] text-muted/50 flex-wrap">
                {zone && <span className="flex items-center gap-1"><MapPin size={9}/>{zone.name}</span>}
                {task.dueDate && <span className="flex items-center gap-1"><Calendar size={9}/>{new Date(task.dueDate).toLocaleDateString('en',{month:'short',day:'numeric'})}</span>}
                <span className="flex items-center gap-1"><Clock size={9}/>{task.estimatedMinutes}m</span>
                <span className={`capitalize font-semibold ${IMPACT_ACCENT[task.impact??'medium']}`}>{task.impact} impact</span>
                {task.isTarget && <span className="flex items-center gap-1 text-accent/70"><Target size={9}/>Target</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {ctxMenu && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.1 }}
              className="fixed inset-0 z-[90]" onClick={() => setCtxMenu(null)} />
            <motion.div
              initial={{ opacity:0, scale:0.94, y:-4 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.94 }}
              transition={{ type:'spring', stiffness:500, damping:32 }}
              className="fixed z-[100] min-w-48 bg-black/90 backdrop-blur-2xl border border-white/[0.09] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden text-xs"
              style={{
                top:  ctxMenu.y + 180 > window.innerHeight ? ctxMenu.y - 200 : ctxMenu.y + 4,
                left: ctxMenu.x + 200 > window.innerWidth  ? ctxMenu.x - 200 : ctxMenu.x + 4,
              }}
              onClick={e => e.stopPropagation()}>
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <p className="font-semibold text-foreground/80 truncate max-w-44">{task.title}</p>
              </div>
              {[
                { icon: <CheckCircle size={13}/>, label:'Complete', action: ()=>{ onComplete(task.id); setCtxMenu(null); }, color:'text-green-400' },
                { icon: <Edit3 size={13}/>, label:'Edit', action: ()=>{ setSelectedTaskId(task.id); setCtxMenu(null); } },
                { icon: <ArrowRight size={13}/>, label:'Snooze to Today', action:()=>handleReschedule(0) },
                { icon: <Calendar size={13}/>, label:'Reschedule Tomorrow', action:()=>handleReschedule(1) },
                { icon: <Trash2 size={13}/>, label:'Delete', action:()=>{ deleteTask(task.id); setCtxMenu(null); }, color:'text-red-400' },
              ].map((item, i) => (
                <button key={i} type="button" onClick={item.action}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.05] transition-colors ${item.color ?? 'text-foreground/70'}`}>
                  {item.icon}{item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
