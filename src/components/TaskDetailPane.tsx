import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Target, Zap, Brain, BarChart, Minus, Plus, ChevronLeft, Circle, CheckCircle, Trash2 } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function TaskDetailPane() {
  const tasks = useTaskStore((state) => state.tasks);
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
  const [content, setContent] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'deep-work' | 'light-work'>('light-work');
  const [impact, setImpact] = useState<'low' | 'medium' | 'high'>('medium');
  const [isTarget, setIsTarget] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [dueDate, setDueDate] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setContent(task.content ?? '');
      setEnergyLevel(task.energyLevel);
      setImpact(task.impact);
      setIsTarget(task.isTarget);
      setEstimatedMinutes(task.estimatedMinutes);
      setDueDate(task.dueDate ? task.dueDate.slice(0, 16) : '');
      setNewChecklistItem('');
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    updateTask(task.id, {
      title,
      content: content || undefined,
      energyLevel,
      impact,
      isTarget,
      estimatedMinutes,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          key="task-detail-backdrop"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedTaskId(null);
            }
          }}
        >
          <motion.div
            className="fixed inset-4 md:inset-10 z-50 bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors md:hidden"
              >
                <ChevronLeft size={18} />
                Back
              </button>
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                Task Detail
              </span>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="hidden md:flex p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Pane — Content */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSave}
                  className="w-full bg-transparent text-2xl font-medium text-foreground tracking-tight focus:outline-none placeholder:text-white/20"
                  placeholder="Task title"
                />

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onBlur={handleSave}
                  className="w-full min-h-[200px] bg-card/50 rounded-xl p-4 text-sm text-foreground/80 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none placeholder:text-white/20"
                  placeholder="Add notes, links, markdown..."
                />

                {/* Checklist */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Subtasks
                  </label>
                  <div className="flex flex-col gap-1">
                    {(task?.checklist || []).map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (task) toggleChecklistItem(task.id, item.id);
                          }}
                          className="text-muted hover:text-foreground transition-colors shrink-0"
                        >
                          {item.isDone ? <CheckCircle size={14} /> : <Circle size={14} />}
                        </button>
                        <span className={`text-xs flex-1 ${item.isDone ? 'line-through text-muted' : 'text-foreground/80'}`}>
                          {item.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (task) deleteChecklistItem(task.id, item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-400 shrink-0 p-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newChecklistItem.trim() && task) {
                          addChecklistItem(task.id, newChecklistItem.trim());
                          setNewChecklistItem('');
                        }
                      }}
                      placeholder="Add subtask (Press Enter)"
                      className="w-full bg-transparent text-xs text-foreground/80 focus:outline-none placeholder:text-white/20 py-1.5 px-2"
                    />
                  </div>
                </div>
              </div>

              {/* Right Pane — Metadata */}
              <div className="w-full md:w-80 bg-[#141415] border-l border-white/5 p-6 overflow-y-auto flex flex-col gap-6 shrink-0">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Energy
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEnergyLevel(energyLevel === 'deep-work' ? 'light-work' : 'deep-work');
                    }}
                    onBlur={handleSave}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      energyLevel === 'deep-work'
                        ? 'bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20'
                        : 'bg-card border border-white/5 text-muted hover:text-foreground'
                    }`}
                  >
                    {energyLevel === 'deep-work' ? <Brain size={14} /> : <Zap size={14} />}
                    {energyLevel === 'deep-work' ? 'Deep Work' : 'Light Work'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Impact
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setImpact((prev) => (prev === 'high' ? 'low' : prev === 'low' ? 'medium' : 'high'))
                    }
                    onBlur={handleSave}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      impact === 'high'
                        ? 'bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20'
                        : 'bg-card border border-white/5 text-muted hover:text-foreground'
                    }`}
                  >
                    <BarChart size={14} />
                    {impact === 'high' ? 'High' : impact === 'medium' ? 'Medium' : 'Low'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Target
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTarget((prev) => !prev);
                    }}
                    onBlur={handleSave}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isTarget
                        ? 'bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20'
                        : 'bg-card border border-white/5 text-muted hover:text-foreground'
                    }`}
                  >
                    <Target size={14} />
                    {isTarget ? 'Active Target' : 'Not Target'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onBlur={handleSave}
                    className="w-full bg-card border border-white/5 rounded-lg px-3 py-2 text-xs text-foreground/80 focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                    Estimated Time
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEstimatedMinutes(Math.max(15, estimatedMinutes - 15))}
                      onBlur={handleSave}
                      className="p-1 rounded transition-colors text-muted hover:text-accent hover:bg-accent/10"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min={15}
                      max={480}
                      step={15}
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Math.min(480, Math.max(15, Number(e.target.value))))}
                      onBlur={handleSave}
                      className="w-16 bg-card border border-white/5 rounded-lg px-3 py-2 text-xs text-foreground/80 text-center focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                    <button
                      type="button"
                      onClick={() => setEstimatedMinutes(Math.min(480, estimatedMinutes + 15))}
                      onBlur={handleSave}
                      className="p-1 rounded transition-colors text-muted hover:text-accent hover:bg-accent/10"
                    >
                      <Plus size={14} />
                    </button>
                    <span className="text-xs text-muted">min</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
