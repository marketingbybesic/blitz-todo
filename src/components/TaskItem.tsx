import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Circle, CheckCircle, Brain, Zap, Trash2, Pencil, ListChecks } from 'lucide-react';
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
  const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId);
  const deleteTask = useTaskStore((state) => state.deleteTask);

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

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick, { capture: true, once: true });
    return () => window.removeEventListener('click', handleClick, { capture: true });
  }, [contextMenu]);

  const EnergyIcon = task.energyLevel === 'deep-work' ? Brain : Zap;

  return (
    <>
      <div
        className="group flex items-center justify-between p-3 rounded-lg hover:bg-[#09090b] transition-colors relative overflow-hidden"
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
          className="cursor-pointer flex-1 flex items-center justify-between min-w-0"
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

          <div className="items-center gap-3 flex md:hidden md:group-hover:flex relative z-10 shrink-0 ml-3">
            <span className="text-xs text-muted"><EnergyIcon size={14} /></span>
            {task.checklist && task.checklist.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                <ListChecks size={12} />
                {task.checklist.filter((i) => i.isDone).length}/{task.checklist.length}
              </div>
            )}
            <span className="text-xs text-muted tabular-nums">
              {task.estimatedMinutes}m
            </span>
          </div>
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 min-w-[140px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              deleteTask(task.id);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/5 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTaskId(task.id);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/5 transition-colors"
          >
            <Pencil size={14} />
            Rename
          </button>
        </div>
      )}
    </>
  );
}
