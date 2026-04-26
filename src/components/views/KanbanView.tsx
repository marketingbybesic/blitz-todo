import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import type { Task } from '../../types';

const COLUMNS = [
  { id: 'todo' as const,        label: 'To Do',       color: 'text-blue-400' },
  { id: 'in_progress' as const, label: 'In Progress', color: 'text-orange-400' },
  { id: 'done' as const,        label: 'Done',        color: 'text-green-400' },
] satisfies Array<{ id: Task['status']; label: string; color: string }>;

export function KanbanView() {
  const tasks = useTaskStore(s => s.tasks);
  const updateTask = useTaskStore(s => s.updateTask);
  const toggleCaptureModal = useTaskStore(s => s.toggleCaptureModal);

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Task['status'] | null>(null);

  const handleDrop = async (colId: Task['status']) => {
    if (!dragging) return;
    await updateTask(dragging, { status: colId });
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div className="flex gap-4 p-4 h-full overflow-x-auto">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} className="flex flex-col w-64 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{col.label}</span>
                <span className="text-xs text-muted bg-card px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              {col.id === 'todo' && (
                <button onClick={toggleCaptureModal} className="text-muted hover:text-foreground transition-colors">
                  <Plus size={14} />
                </button>
              )}
            </div>
            <div
              className={`flex-1 flex flex-col gap-2 p-2 rounded-xl border-2 transition-colors min-h-24 ${
                dragOver === col.id ? 'border-accent/40 bg-accent/5' : 'border-transparent'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.id)}
            >
              <AnimatePresence>
                {colTasks.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    draggable
                    onDragStart={() => setDragging(task.id)}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none transition-opacity ${dragging === task.id ? 'opacity-40' : ''}`}
                  >
                    <p className="text-sm text-foreground leading-snug mb-2">{task.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className={task.impact === 'high' ? 'text-orange-400' : task.impact === 'medium' ? 'text-blue-400' : ''}>{task.impact}</span>
                      <span>·</span>
                      <span>{task.estimatedMinutes}m</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {colTasks.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-xs text-muted/40 py-8">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
