import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Zap, Clock, Target, FolderOpen, X, Pencil, Check } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import type { Task, Zone } from '../../types';

// Phase colors palette
const PHASE_COLORS = [
  { hex: '#60a5fa', label: 'Blue' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#4ade80', label: 'Green' },
  { hex: '#a855f7', label: 'Purple' },
  { hex: '#f43f5e', label: 'Red' },
  { hex: '#facc15', label: 'Yellow' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#a1a1aa', label: 'Grey' },
];

interface Phase {
  id: Task['status'] | string;
  label: string;
  color: string;
}

const DEFAULT_PHASES: Phase[] = [
  { id: 'todo',        label: 'To Do',       color: '#60a5fa' },
  { id: 'in_progress', label: 'In Progress', color: '#f97316' },
  { id: 'done',        label: 'Done',        color: '#4ade80' },
];

// Per-project phases stored in localStorage
function loadPhases(zoneId: string): Phase[] {
  try {
    const raw = localStorage.getItem(`blitz-phases-${zoneId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_PHASES;
}

function savePhases(zoneId: string, phases: Phase[]) {
  localStorage.setItem(`blitz-phases-${zoneId}`, JSON.stringify(phases));
}

function ProjectGantt({ tasks }: { tasks: Task[] }) {
  const now = Date.now();
  const hasDates = tasks.some(t => t.dueDate);
  if (!hasDates) return null;

  const dateTasks = tasks.filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  const start = new Date(dateTasks[0]?.dueDate ?? now);
  const end   = new Date(dateTasks[dateTasks.length - 1]?.dueDate ?? now);
  const span  = Math.max(end.getTime() - start.getTime(), 86400000);

  return (
    <div className="mb-5 px-1">
      <div className="text-[9px] font-semibold text-muted/30 uppercase tracking-widest mb-2">Timeline</div>
      <div className="relative h-6 bg-white/[0.03] rounded-full overflow-hidden">
        {dateTasks.map(t => {
          const pos  = ((new Date(t.dueDate!).getTime() - start.getTime()) / span) * 100;
          const done = t.status === 'done';
          return (
            <div key={t.id} title={t.title}
              className="absolute top-1 h-4 w-4 rounded-full border-2 transition-all"
              style={{
                left: `calc(${Math.max(0, Math.min(92, pos))}%)`,
                background: done ? '#4ade80' : 'var(--accent)',
                borderColor: done ? '#4ade80' : 'color-mix(in srgb, var(--accent) 50%, transparent)',
              }} />
          );
        })}
        <div className="absolute top-0 bottom-0 w-px bg-accent/40"
          style={{ left: `${Math.max(0, Math.min(100, ((now - start.getTime()) / span) * 100))}%` }} />
      </div>
      <div className="flex justify-between text-[9px] text-muted/30 mt-1">
        <span>{start.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
        <span>{end.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}

function PhaseEditor({ phase, onSave, onDelete, canDelete }: {
  phase: Phase;
  onSave: (updated: Phase) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [label, setLabel] = useState(phase.label);
  const [color, setColor] = useState(phase.color);

  return (
    <div className="flex items-center gap-2 p-2 bg-black/60 border border-white/[0.06] rounded-xl">
      {/* Color picker */}
      <div className="flex gap-1 flex-wrap w-28">
        {PHASE_COLORS.map(c => (
          <button
            key={c.hex}
            type="button"
            onClick={() => setColor(c.hex)}
            className="w-4 h-4 rounded-full transition-all"
            style={{
              background: c.hex,
              outline: color === c.hex ? `2px solid ${c.hex}` : 'none',
              outlineOffset: 2,
              opacity: color === c.hex ? 1 : 0.5,
            }}
          />
        ))}
      </div>
      {/* Label input */}
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        className="flex-1 bg-transparent text-xs text-foreground focus:outline-none min-w-0"
        onKeyDown={e => { if (e.key === 'Enter') onSave({ ...phase, label, color }); }}
        maxLength={20}
      />
      <button type="button" onClick={() => onSave({ ...phase, label, color })}
        className="p-1 rounded text-green-400/70 hover:text-green-400 transition-colors flex-shrink-0">
        <Check size={12} />
      </button>
      {canDelete && (
        <button type="button" onClick={onDelete}
          className="p-1 rounded text-muted/30 hover:text-red-400/70 transition-colors flex-shrink-0">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function ProjectDetail({ zone, tasks, onBack, updateTask, completeTask, addTask }: {
  zone: Zone; tasks: Task[]; onBack: () => void;
  updateTask: (id: string, u: Partial<Task>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
}) {
  const [phases, setPhases]     = useState<Phase[]>(() => loadPhases(zone.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [addingCol, setAddingCol] = useState<string | null>(null);
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [showPhaseEditor, setShowPhaseEditor] = useState(false);

  const handleDrop = async (colId: string) => {
    if (!dragging) return;
    await updateTask(dragging, { status: colId as Task['status'] });
    setDragging(null); setDragOver(null);
  };

  const handleAdd = async (colId: string) => {
    if (!newTitle.trim()) return;
    await addTask({
      title: newTitle.trim(), energyLevel: 'light-work', estimatedMinutes: 25,
      isTarget: false, status: colId as Task['status'], impact: 'medium',
      dueDate: undefined, content: undefined, zoneId: zone.id,
      startDate: undefined, checklist: [],
    });
    setNewTitle(''); setAddingCol(null);
  };

  const updatePhase = (updated: Phase) => {
    const next = phases.map(p => p.id === updated.id ? updated : p);
    setPhases(next);
    savePhases(zone.id, next);
    setEditingPhase(null);
  };

  const deletePhase = (id: string) => {
    const next = phases.filter(p => p.id !== id);
    setPhases(next);
    savePhases(zone.id, next);
  };

  const addPhase = () => {
    const next: Phase = { id: `phase-${Date.now()}`, label: 'New Phase', color: '#a855f7' };
    const updated = [...phases, next];
    setPhases(updated);
    savePhases(zone.id, updated);
    setEditingPhase(next.id);
  };

  const done  = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const pct   = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Project header — no border */}
      <div className="flex items-center gap-3 px-6 py-4 shrink-0">
        <button type="button" onClick={onBack}
          className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.04] transition-colors">
          <ChevronRight size={14} className="rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold truncate">{zone.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div className="h-full bg-accent rounded-full" animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }} />
            </div>
            <span className="text-[10px] text-muted/40 tabular-nums">{done}/{total}</span>
          </div>
        </div>
        {/* Edit phases toggle */}
        <button type="button" onClick={() => setShowPhaseEditor(s => !s)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-all ${showPhaseEditor ? 'text-accent bg-accent/10' : 'text-muted/40 hover:text-muted'}`}>
          <Pencil size={11} /> Phases
        </button>
      </div>

      {/* Phase editor panel */}
      <AnimatePresence>
        {showPhaseEditor && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-6 pb-3"
          >
            <div className="flex flex-col gap-1.5 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div className="text-[9px] font-semibold text-muted/30 uppercase tracking-widest mb-1">Edit phases &amp; colors</div>
              {phases.map(phase => (
                editingPhase === phase.id ? (
                  <PhaseEditor key={phase.id} phase={phase}
                    onSave={updatePhase} onDelete={() => deletePhase(phase.id)}
                    canDelete={phases.length > 1} />
                ) : (
                  <div key={phase.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] group cursor-pointer"
                    onClick={() => setEditingPhase(phase.id)}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: phase.color }} />
                    <span className="text-xs text-foreground/70 flex-1">{phase.label}</span>
                    <Pencil size={10} className="text-muted/20 group-hover:text-muted/50 transition-colors" />
                  </div>
                )
              ))}
              <button type="button" onClick={addPhase}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-muted/30 hover:text-accent transition-colors mt-0.5">
                <Plus size={11} /> Add phase
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gantt mini */}
      <div className="px-6">
        <ProjectGantt tasks={tasks} />
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto flex-1 items-start pt-2">
        {phases.map(phase => {
          const colTasks = tasks.filter(t => t.status === phase.id);
          return (
            <div key={phase.id} className="flex flex-col w-60 flex-shrink-0 min-h-40">
              {/* Column header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: phase.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: phase.color }}>{phase.label}</span>
                  <span className="text-[10px] text-muted/30 font-mono">{colTasks.length}</span>
                </div>
                <button type="button" onClick={() => setAddingCol(phase.id)}
                  className="text-muted/30 hover:text-accent transition-colors">
                  <Plus size={13} />
                </button>
              </div>

              {/* Drop zone */}
              <div
                className="flex flex-col gap-2 p-2 rounded-xl border transition-all flex-1 min-h-12"
                style={{
                  borderColor: dragOver === phase.id ? `${phase.color}40` : 'transparent',
                  background: dragOver === phase.id ? `${phase.color}08` : 'transparent',
                }}
                onDragOver={e => { e.preventDefault(); setDragOver(phase.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(phase.id)}
              >
                {/* Inline add */}
                <AnimatePresence>
                  {addingCol === phase.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <input autoFocus type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAdd(phase.id); if (e.key === 'Escape') { setAddingCol(null); setNewTitle(''); } }}
                        onBlur={() => { if (!newTitle.trim()) setAddingCol(null); }}
                        placeholder="Task title  ↵"
                        className="w-full bg-white/[0.04] rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none mb-1"
                        style={{ border: 'none' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {colTasks.map(task => (
                    <motion.div key={task.id} layout
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      draggable onDragStart={() => setDragging(task.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      className="group bg-black/60 rounded-xl p-3 cursor-grab active:cursor-grabbing select-none transition-all"
                      style={{
                        opacity: dragging === task.id ? 0.3 : 1,
                        border: `1px solid ${phase.color}20`,
                      }}
                    >
                      <p className="text-xs font-medium text-foreground/85 leading-snug mb-2">{task.title}</p>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className={task.impact === 'high' ? 'text-accent' : task.impact === 'medium' ? 'text-blue-400/70' : 'text-muted/40'}>
                          {task.impact}
                        </span>
                        <span className="text-muted/25">·</span>
                        <span className="text-muted/40 flex items-center gap-0.5"><Clock size={9} />{task.estimatedMinutes}m</span>
                        {task.isTarget && <Target size={9} className="text-accent/60 ml-auto" />}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colTasks.length === 0 && addingCol !== phase.id && (
                  <button type="button" onClick={() => setAddingCol(phase.id)}
                    className="w-full py-3 text-xs text-muted/25 hover:text-muted/50 rounded-xl transition-all text-center"
                    style={{ border: '1px dashed rgba(255,255,255,0.05)' }}
                  >
                    + Add task
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function KanbanView() {
  const tasks            = useTaskStore(s => s.tasks);
  const zones            = useTaskStore(s => s.zones);
  const updateTask       = useTaskStore(s => s.updateTask);
  const completeTask     = useTaskStore(s => s.completeTask);
  const addTask          = useTaskStore(s => s.addTask);
  const addZone          = useTaskStore(s => s.addZone);
  const toggleBlitzMode  = useTaskStore(s => s.toggleBlitzMode);

  const [activeZone, setActiveZone]     = useState<Zone | null>(null);
  const [newZoneName, setNewZoneName]   = useState('');
  const [adding, setAdding]             = useState(false);

  const projectTasks = useMemo(() => {
    if (!activeZone) return [];
    return tasks.filter(t => t.zoneId === activeZone.id);
  }, [tasks, activeZone]);

  const handleAddZone = async () => {
    if (!newZoneName.trim()) return;
    await addZone(newZoneName.trim());
    setNewZoneName(''); setAdding(false);
  };

  if (activeZone) {
    return (
      <ProjectDetail zone={activeZone} tasks={projectTasks} onBack={() => setActiveZone(null)}
        updateTask={updateTask} completeTask={completeTask} addTask={addTask} />
    );
  }

  const unzoned = tasks.filter(t => !t.zoneId && t.status !== 'done');

  return (
    <div className="max-w-3xl mx-auto pt-10 px-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Projects</h1>
          <p className="text-xs text-muted mt-0.5">{zones.length} project{zones.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleBlitzMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-accent/15 text-accent hover:bg-accent/25 transition-all"
            style={{ boxShadow: '0 0 12px color-mix(in srgb, var(--accent) 20%, transparent)' }}>
            <Zap size={12} /> Burst Mode
          </button>
          <button type="button" onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-white/[0.04] transition-all">
            <Plus size={13} /> New Project
          </button>
        </div>
      </div>

      {/* New project input */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
            <div className="flex gap-2">
              <input autoFocus type="text" value={newZoneName} onChange={e => setNewZoneName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddZone(); if (e.key === 'Escape') { setAdding(false); setNewZoneName(''); } }}
                placeholder="Project name  ↵"
                className="flex-1 bg-white/[0.04] rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none transition-colors"
                style={{ border: 'none' }}
              />
              <button type="button" onClick={() => { setAdding(false); setNewZoneName(''); }}
                className="p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-white/[0.04] transition-colors">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects list */}
      <div className="flex flex-col gap-3">
        {zones.map(zone => {
          const zoneTasks = tasks.filter(t => t.zoneId === zone.id);
          const done  = zoneTasks.filter(t => t.status === 'done').length;
          const total = zoneTasks.length;
          const pct   = total > 0 ? (done / total) * 100 : 0;
          const inProg = zoneTasks.filter(t => t.status === 'in_progress').length;

          return (
            <motion.button key={zone.id} type="button" layout onClick={() => setActiveZone(zone)}
              className="group w-full flex items-center gap-4 p-4 bg-black/50 rounded-2xl hover:bg-white/[0.02] transition-all text-left"
              style={{ border: '1px solid rgba(255,255,255,0.05)' }}
              whileHover={{ x: 2 }}>
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen size={18} className="text-accent/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-foreground/90 truncate">{zone.name}</span>
                  <span className="text-[10px] text-muted/30 ml-2 flex-shrink-0">{done}/{total}</span>
                </div>
                <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                {inProg > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="w-1 h-1 rounded-full bg-orange-400" />
                    <span className="text-[10px] text-orange-400/60">{inProg} in progress</span>
                  </div>
                )}
              </div>
              <ChevronRight size={14} className="text-muted/20 group-hover:text-muted/50 transition-colors flex-shrink-0" />
            </motion.button>
          );
        })}

        {/* Unzoned tasks */}
        {unzoned.length > 0 && (
          <div className="mt-2 p-4 bg-white/[0.01] rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-[10px] font-semibold text-muted/30 uppercase tracking-widest mb-3">Unassigned Tasks · {unzoned.length}</div>
            <div className="flex flex-col gap-1.5">
              {unzoned.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-2 text-xs text-muted/60">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.impact === 'high' ? 'bg-accent/60' : t.impact === 'medium' ? 'bg-blue-400/60' : 'bg-muted/30'}`} />
                  <span className="truncate">{t.title}</span>
                  <span className="ml-auto text-muted/30 flex-shrink-0">{t.estimatedMinutes}m</span>
                </div>
              ))}
              {unzoned.length > 5 && <p className="text-[10px] text-muted/25 pl-3.5">+{unzoned.length - 5} more</p>}
            </div>
          </div>
        )}

        {zones.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center" style={{ border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
              <FolderOpen size={24} className="text-accent/60" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/80">No projects yet</p>
              <p className="text-xs text-muted/40 mt-1 max-w-xs">Create a project to organize tasks by context. Each project gets its own Kanban board.</p>
            </div>
            <button type="button" onClick={() => setAdding(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-accent text-black hover:opacity-90 transition-all"
              style={{ boxShadow: '0 0 20px color-mix(in srgb, var(--accent) 30%, transparent)' }}>
              <Plus size={14} /> Create First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
