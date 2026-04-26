import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, CheckCircle, Brain, Zap, Trash2, Calendar, MapPin, ListChecks, Eye, EyeOff, Clock, TrendingUp } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
}

export function TaskItem({ task, onComplete }: TaskItemProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isPeekOpen, setIsPeekOpen] = useState(false);
  const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const zones = useTaskStore((state) => state.zones);
  const zoneName = zones.find((z) => z.id === task.zoneId)?.name;

  const handleComplete = () => {
    setIsCompleting(true);
    setTimeout(() => {
      onComplete(task.id);
    }, 700);
  };

  const handleContextMenuOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const updateTask = useTaskStore((state) => state.updateTask);

  const handleReschedule = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    await updateTask(task.id, { dueDate: tomorrow.toISOString() });
    setContextMenu(null);
  };

  const handleOpenDetail = () => {
    setSelectedTaskId(task.id);
    setContextMenu(null);
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    setContextMenu(null);
  };

  const EnergyIcon = task.energyLevel === 'deep-work' ? Brain : Zap;

  return (
    <>
      <div
        className="group flex flex-col p-3 rounded-lg hover:bg-background transition-colors relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={handleContextMenuOpen}
      >
        {isCompleting && (
          <motion.div
            className="absolute inset-y-0 right-0 bg-accent rounded-lg z-0"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              type="button"
              onClick={handleComplete}
              className="text-muted group-hover:text-foreground/60 transition-colors cursor-pointer"
            >
              {isHovered || isCompleting ? (
                <CheckCircle size={18} />
              ) : (
                <Circle size={18} />
              )}
            </button>
          </div>

          <div
            onClick={() => setSelectedTaskId(task.id)}
            className="cursor-pointer flex-1 flex items-center justify-between min-w-0 ml-3"
          >
            <span
              className={`text-[14px] tracking-wide transition-colors truncate ${
                isCompleting
                  ? 'text-white font-medium'
                  : 'text-foreground/90'
              }`}
            >
              {isCompleting ? (
                <span className="flex items-center gap-1.5">
                  COMPLETED <Zap size={14} />
                </span>
              ) : (
                task.title
              )}
            </span>

            <div className="items-center gap-2 flex md:hidden md:group-hover:flex relative z-10 shrink-0 ml-3">
              <span className="text-xs text-muted"><EnergyIcon size={14} /></span>
              {task.checklist && task.checklist.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/40 bg-card/5 px-2 py-0.5 rounded-full">
                  <ListChecks size={12} />
                  {task.checklist.filter((i) => i.isDone).length}/{task.checklist.length}
                </div>
              )}
              <span className="text-xs text-muted tabular-nums">
                {task.estimatedMinutes}m
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPeekOpen((prev) => !prev);
                }}
                className="opacity-50 md:opacity-0 md:group-hover:opacity-50 hover:!opacity-100 transition-opacity text-muted hover:text-foreground"
              >
                {isPeekOpen ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isPeekOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="mt-2 bg-card/50 backdrop-blur-md rounded-lg p-4 border border-white/10 flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5 text-white/40">
                  <MapPin size={10} className="text-accent/60" />
                  <span className="uppercase text-[9px] tracking-wider">Zone</span>
                  <span className="text-white/70 font-medium ml-0.5">{zoneName || 'None'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40">
                  <Clock size={10} className="text-accent/60" />
                  <span className="uppercase text-[9px] tracking-wider">Time</span>
                  <span className="text-white/70 font-medium ml-0.5">{task.estimatedMinutes}m</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40">
                  <TrendingUp size={10} className="text-accent/60" />
                  <span className="uppercase text-[9px] tracking-wider">Impact</span>
                  <span className="text-white/70 font-medium ml-0.5">{task.impact.charAt(0).toUpperCase() + task.impact.slice(1)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {contextMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="fixed inset-0 z-[99]"
              onClick={() => setContextMenu(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="fixed z-[100] bg-card/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px]"
              style={{
                top: contextMenu.y + 180 > window.innerHeight ? contextMenu.y - 180 : contextMenu.y,
                left: contextMenu.x + 160 > window.innerWidth ? contextMenu.x - 160 : contextMenu.x,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleReschedule}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] text-white/80 hover:bg-white/5 transition-colors duration-75"
              >
                <Calendar size={14} />
                Reschedule (Tomorrow)
              </button>
              <button
                type="button"
                onClick={handleOpenDetail}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] text-white/80 hover:bg-white/5 transition-colors duration-75"
              >
                <MapPin size={14} />
                Change Zone
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] text-red-400 hover:bg-white/5 transition-colors duration-75"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
