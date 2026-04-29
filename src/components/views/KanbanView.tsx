import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Zap, BarChart3, Clock, Target, FolderOpen, X, CheckCircle2, Circle } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import type { Task, Zone } from '../../types';

// Status config with accent shades
const STATUS = [
  { id: 'todo' as Task['status'],        label: 'To Do',       dot: 'bg-blue-400',   ring: 'border-blue-400/30',  text: 'text-blue-400'   },
  { id: 'in_progress' as Task['status'], label: 'In Progress', dot: 'bg-orange-400', ring: 'border-orange-400/30',text: 'text-orange-400' },
  { id: 'done' as Task['status'],        label: 'Done',        dot: 'bg-green-400',  ring: 'border-green-400/30', text: 'text-green-400'  },
];

function ProjectGantt({ tasks }: { tasks: Task[] }) {
  const now = Date.now();
  const hasDates = tasks.some(t => t.dueDate);
  if (!hasDates) return null;

  const dateTasks = tasks.filter(t => t.dueDate).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  const start = new Date(dateTasks[0]?.dueDate ?? now);
  const end   = new Date(dateTasks[dateTasks.length-1]?.dueDate ?? now);
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
              className={`absolute top-1 h-4 w-4 rounded-full border-2 transition-all ${done ? 'bg-green-400 border-green-400' : 'bg-accent border-accent/50'}`}
              style={{ left: `calc(${Math.max(0, Math.min(92, pos))}%)` }} />
          );
        })}
        {/* Today marker */}
        <div className="absolute top-0 bottom-0 w-px bg-accent/40"
          style={{ left: `${Math.max(0,Math.min(100,((now - start.getTime())/span)*100))}%` }} />
      </div>
      <div className="flex justify-between text-[9px] text-muted/30 mt-1">
        <span>{start.toLocaleDateString('en', { month:'short', day:'numeric' })}</span>
        <span>{end.toLocaleDateString('en', { month:'short', day:'numeric' })}</span>
      </div>
    </div>
  );
}

function ProjectDetail({ zone, tasks, onBack, updateTask, completeTask, addTask, toggleCaptureModal }: {
  zone: Zone; tasks: Task[]; onBack: () => void;
  updateTask: (id:string, u:Partial<Task>)=>Promise<void>;
  completeTask: (id:string)=>Promise<void>;
  addTask: (t:Omit<Task,'id'|'createdAt'>)=>Promise<void>;
  toggleCaptureModal: ()=>void;
}) {
  const [dragging, setDragging]  = useState<string|null>(null);
  const [dragOver, setDragOver]  = useState<Task['status']|null>(null);
  const [newTitle, setNewTitle]  = useState('');
  const [addingCol, setAddingCol]= useState<Task['status']|null>(null);

  const handleDrop = async (col: Task['status']) => {
    if (!dragging) return;
    await updateTask(dragging, { status: col });
    setDragging(null); setDragOver(null);
  };

  const handleAdd = async (col: Task['status']) => {
    if (!newTitle.trim()) return;
    await addTask({ title: newTitle.trim(), energyLevel: 'light-work', estimatedMinutes: 25, isTarget: false, status: col, impact: 'medium', dueDate: undefined, content: undefined, zoneId: zone.id, startDate: undefined, checklist: [] });
    setNewTitle(''); setAddingCol(null);
  };

  const done  = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const pct   = total > 0 ? (done/total)*100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05] shrink-0">
        <button type="button" onClick={onBack} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.04] transition-colors">
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
      </div>

      {/* Gantt mini */}
      <div className="px-6 pt-4">
        <ProjectGantt tasks={tasks} />
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto flex-1 items-start">
        {STATUS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="flex flex-col w-60 flex-shrink-0 min-h-40">
              {/* Column header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                  <span className={`text-[11px] font-semibold ${col.text}`}>{col.label}</span>
                  <span className="text-[10px] text-muted/30 font-mono">{colTasks.length}</span>
                </div>
                <button type="button" onClick={() => setAddingCol(col.id)}
                  className="text-muted/30 hover:text-accent transition-colors"><Plus size={13}/></button>
              </div>

              {/* Drop zone */}
              <div className={`flex flex-col gap-2 p-2 rounded-xl border transition-colors flex-1 min-h-12 ${
                dragOver === col.id ? `${col.ring} bg-white/[0.03]` : 'border-transparent'
              }`}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(col.id)}>

                {/* Inline add */}
                <AnimatePresence>
                  {addingCol === col.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <input autoFocus type="text" value={newTitle} onChange={e=>setNewTitle(e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Enter') handleAdd(col.id); if(e.key==='Escape'){setAddingCol(null);setNewTitle('');} }}
                        onBlur={()=>{if(!newTitle.trim())setAddingCol(null);}}
                        placeholder="Task title  ↵"
                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/40 mb-1" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {colTasks.map(task => (
                    <motion.div key={task.id} layout
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      draggable onDragStart={() => setDragging(task.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      className={`group bg-black/60 border rounded-xl p-3 cursor-grab active:cursor-grabbing select-none transition-all ${
                        dragging === task.id ? 'opacity-30' : `${col.ring} hover:border-opacity-60`
                      } border border-white/[0.06]`}>
                      <p className="text-xs font-medium text-foreground/85 leading-snug mb-2">{task.title}</p>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className={task.impact === 'high' ? 'text-accent' : task.impact === 'medium' ? 'text-blue-400/70' : 'text-muted/40'}>
                          {task.impact}
                        </span>
                        <span className="text-muted/25">·</span>
                        <span className="text-muted/40 flex items-center gap-0.5"><Clock size={9}/>{task.estimatedMinutes}m</span>
                        {task.isTarget && <Target size={9} className="text-accent/60 ml-auto" />}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colTasks.length === 0 && addingCol !== col.id && (
                  <button
                    type="button"
                    onClick={() => setAddingCol(col.id)}
                    className="w-full py-3 text-xs text-muted/25 hover:text-muted/50 border border-dashed border-white/[0.04] hover:border-white/[0.08] rounded-xl transition-all text-center"
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
  const toggleCaptureModal = useTaskStore(s => s.toggleCaptureModal);
  const toggleBlitzMode  = useTaskStore(s => s.toggleBlitzMode);

  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [adding, setAdding] = useState(false);

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
        updateTask={updateTask} completeTask={completeTask} addTask={addTask} toggleCaptureModal={toggleCaptureModal} />
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
            <Zap size={12} /> Burst Mode
          </button>
          <button type="button" onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-card border border-border text-muted hover:text-foreground hover:border-border/80 transition-all">
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
                className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/40 transition-colors" />
              <button type="button" onClick={() => { setAdding(false); setNewZoneName(''); }}
                className="p-2.5 rounded-xl bg-card border border-border text-muted hover:text-foreground transition-colors"><X size={14}/></button>
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
          const pct   = total > 0 ? (done/total)*100 : 0;
          const inProg = zoneTasks.filter(t => t.status === 'in_progress').length;

          return (
            <motion.button key={zone.id} type="button" layout onClick={() => setActiveZone(zone)}
              className="group w-full flex items-center gap-4 p-4 bg-black/50 border border-white/[0.06] rounded-2xl hover:border-accent/20 hover:bg-white/[0.02] transition-all text-left"
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
          <div className="mt-2 p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
            <div className="text-[10px] font-semibold text-muted/30 uppercase tracking-widest mb-3">Unassigned Tasks · {unzoned.length}</div>
            <div className="flex flex-col gap-1.5">
              {unzoned.slice(0,5).map(t => (
                <div key={t.id} className="flex items-center gap-2 text-xs text-muted/60">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.impact === 'high' ? 'bg-accent/60' : t.impact === 'medium' ? 'bg-blue-400/60' : 'bg-muted/30'}`} />
                  <span className="truncate">{t.title}</span>
                  <span className="ml-auto text-muted/30 flex-shrink-0">{t.estimatedMinutes}m</span>
                </div>
              ))}
              {unzoned.length > 5 && <p className="text-[10px] text-muted/25 pl-3.5">+{unzoned.length-5} more</p>}
            </div>
          </div>
        )}

        {zones.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <FolderOpen size={24} className="text-accent/60" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/80">No projects yet</p>
              <p className="text-xs text-muted/40 mt-1 max-w-xs">Create a project to organize tasks by context. Each project gets its own Kanban board.</p>
            </div>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-accent text-black hover:opacity-90 transition-all"
              style={{ boxShadow: '0 0 20px color-mix(in srgb, var(--accent) 30%, transparent)' }}
            >
              <Plus size={14} /> Create First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
