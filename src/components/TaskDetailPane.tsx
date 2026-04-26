import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Target, Zap, Brain, BarChart, Minus, Plus, Circle, CheckCircle2, Trash2, ChevronDown } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { RichTextEditor } from './RichTextEditor';

export function TaskDetailPane() {
  const tasks = useTaskStore((state) => state.tasks);
  const zones = useTaskStore((state) => state.zones);
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId);
  const updateTask = useTaskStore((state) => state.updateTask);
  const addChecklistItem = useTaskStore((state) => state.addChecklistItem);
  const toggleChecklistItem = useTaskStore((state) => state.toggleChecklistItem);
  const deleteChecklistItem = useTaskStore((state) => state.deleteChecklistItem);

  const task = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const [title, setTitle] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNewChecklistItem('');
    }
  }, [task]);

  const energyValue = task?.energyLevel ?? 'light-work';
  const impactValue = task?.impact ?? 'medium';
  const estimatedValue = task?.estimatedMinutes ?? 15;

  const formatEstimate = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  return (
    <AnimatePresence>
      {task && (
        <>
          {/* Backdrop */}
          <motion.div
            key="task-detail-backdrop"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTaskId(null)}
          />

          {/* Sliding Panel */}
          <motion.div
            key="task-detail-panel"
            className="fixed right-0 top-0 h-screen w-full md:w-[720px] bg-background border-l border-white/10 z-50 shadow-2xl flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                Task Detail
              </span>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-card/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body — Two-Column on Desktop */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Column — Content */}
              <div className="flex-[3] min-w-0 overflow-y-auto p-6 flex flex-col gap-6">
                {/* Title */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    updateTask(task.id, { title: e.target.value });
                  }}
                  className="text-2xl font-bold bg-transparent text-foreground placeholder:text-white/20 focus:outline-none w-full"
                  placeholder="Task Name"
                />

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Notes
                  </label>
                  <RichTextEditor
                    content={task.content || ''}
                    onChange={(html) => updateTask(task.id, { content: html })}
                  />
                </div>

                {/* Checklist */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Subtasks
                  </label>
                  <div className="flex flex-col gap-1">
                    {(task.checklist || []).map((item) => (
                      <div key={item.id} className="group flex items-center gap-3 hover:bg-card/5 p-2 rounded-lg transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(task.id, item.id)}
                        >
                          {item.isDone ? <CheckCircle2 className="text-accent" size={16} /> : <Circle className="text-white/20 group-hover:text-white/40" size={16} />}
                        </button>
                        <span className={`flex-1 text-sm ${item.isDone ? 'text-white/20 line-through' : 'text-foreground/80'}`}>{item.title}</span>
                        <button
                          type="button"
                          onClick={() => deleteChecklistItem(task.id, item.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newChecklistItem.trim()) {
                          addChecklistItem(task.id, newChecklistItem.trim());
                          setNewChecklistItem('');
                        }
                      }}
                      placeholder="Add subtask (Press Enter)"
                      className="w-full bg-transparent border-b border-white/10 focus:border-accent pb-2 text-sm text-foreground placeholder:text-white/30 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Gradient Separator */}
              <div className="hidden md:block w-px shrink-0 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

              {/* Right Column — Metadata */}
              <div className="flex-[2] min-w-0 overflow-y-auto p-6 flex flex-col gap-5 border-t md:border-t-0 border-white/5">
                {/* Zone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Zone
                  </label>
                  <div className="relative">
                    <select
                      value={task.zoneId || ''}
                      onChange={(e) => updateTask(task.id, { zoneId: e.target.value || undefined })}
                      className="w-full appearance-none bg-card border border-white/5 rounded-lg px-3 py-2 text-xs text-foreground/80 focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
                    >
                      <option value="">No Zone</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Energy — Segmented Control */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Energy
                  </label>
                  <div className="flex rounded-lg bg-card border border-white/5 overflow-hidden">
                    {[
                      { value: 'deep-work' as const, label: 'Deep Work', icon: Brain },
                      { value: 'light-work' as const, label: 'Light Work', icon: Zap },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateTask(task.id, { energyLevel: value })}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${
                          energyValue === value
                            ? 'bg-accent/15 text-accent'
                            : 'text-muted hover:text-foreground hover:bg-white/5'
                        }`}
                      >
                        <Icon size={13} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Impact — Segmented Control */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Impact
                  </label>
                  <div className="flex rounded-lg bg-card border border-white/5 overflow-hidden">
                    {[
                      { value: 'low' as const, label: 'Low' },
                      { value: 'medium' as const, label: 'Medium' },
                      { value: 'high' as const, label: 'High' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateTask(task.id, { impact: value })}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${
                          impactValue === value
                            ? 'bg-accent/15 text-accent'
                            : 'text-muted hover:text-foreground hover:bg-white/5'
                        }`}
                      >
                        <BarChart size={13} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Target
                  </label>
                  <button
                    type="button"
                    onClick={() => updateTask(task.id, { isTarget: !task.isTarget })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      task.isTarget
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'bg-card border border-white/5 text-muted hover:text-foreground'
                    }`}
                  >
                    <Target size={14} />
                    {task.isTarget ? 'Active Target' : 'Not Target'}
                  </button>
                </div>

                {/* Due Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={task.dueDate ? task.dueDate.slice(0, 16) : ''}
                    onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })}
                    className="w-full bg-card border border-white/5 rounded-lg px-3 py-2 text-xs text-foreground/80 focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>

                {/* Estimated Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Estimated Time
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateTask(task.id, { estimatedMinutes: Math.max(15, estimatedValue - 15) })}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-card border border-white/5 text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all active:scale-95"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-20 text-center text-sm font-medium text-foreground tabular-nums">
                      {formatEstimate(estimatedValue)}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateTask(task.id, { estimatedMinutes: Math.min(480, estimatedValue + 15) })}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-card border border-white/5 text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all active:scale-95"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
