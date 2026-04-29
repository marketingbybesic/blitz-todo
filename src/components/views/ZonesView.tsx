import { useEffect, useMemo, useState } from 'react';
import { Plus, Zap, X, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskItem } from '../TaskItem';

const ZONE_COLORS = ['#a855f7','#3b82f6','#06b6d4','#22c55e','#f97316','#ec4899','#eab308','#64748b'];

function formatMinutes(mins: number): string {
  if (mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function ZonesView() {
  const tasks         = useTaskStore(s => s.tasks);
  const zones         = useTaskStore(s => s.zones);
  const loadZones     = useTaskStore(s => s.loadZones);
  const addZone       = useTaskStore(s => s.addZone);
  const completeTask  = useTaskStore(s => s.completeTask);
  const toggleBlitz   = useTaskStore(s => s.toggleBlitzMode);

  const [newName, setNewName]   = useState('');
  const [adding, setAdding]     = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => { loadZones(); }, [loadZones]);

  const grouped = useMemo(() => {
    const map = new Map<string | null, typeof tasks>();
    for (const t of tasks) {
      if (t.status === 'done') continue;
      const key = t.zoneId ?? null;
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [tasks]);

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addZone(newName.trim());
    setNewName(''); setAdding(false);
  };

  const zoneEntries = useMemo(() => {
    const list = zones.map((z, i) => ({
      id: z.id, name: z.name, color: ZONE_COLORS[i % ZONE_COLORS.length],
      tasks: grouped.get(z.id) ?? [],
    }));
    const uncat = grouped.get(null) ?? [];
    if (uncat.length > 0) list.push({ id: 'uncat', name: 'Unassigned', color: '#64748b', tasks: uncat });
    return list;
  }, [zones, grouped]);

  const totalActive = tasks.filter(t => t.status !== 'done').length;

  return (
    <div className="max-w-3xl mx-auto pt-10 px-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Zones</h1>
          <p className="text-xs text-muted mt-0.5">{zones.length} zones · {totalActive} active tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleBlitz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
            <Zap size={12} /> Burst Mode
          </button>
          <button type="button" onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-card border border-border text-muted hover:text-foreground transition-all">
            <Plus size={13} /> New Zone
          </button>
        </div>
      </div>

      {/* Add zone input */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="mb-4">
            <div className="flex gap-2">
              <input autoFocus type="text" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') handleAdd(); if (e.key==='Escape') { setAdding(false); setNewName(''); } }}
                placeholder="Zone name  ↵"
                className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/40 transition-colors" />
              <button type="button" onClick={() => { setAdding(false); setNewName(''); }}
                className="p-2.5 rounded-xl bg-card border border-border text-muted hover:text-foreground transition-colors"><X size={14}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {zoneEntries.map(entry => {
          const isOpen = expanded.has(entry.id);
          const doneTasks = tasks.filter(t => t.zoneId === (entry.id === 'uncat' ? undefined : entry.id) && t.status === 'done').length;
          const total     = entry.tasks.length + doneTasks;
          const pct       = total > 0 ? (doneTasks / total) * 100 : 0;
          const totalEstimated = entry.tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
          const previewTasks = entry.tasks.slice(0, 3);

          return (
            <div key={entry.id} className="flex flex-col">
              <motion.div
                className="bg-black/50 border border-white/[0.07] rounded-2xl p-4 cursor-pointer group hover:border-accent/20 transition-all"
                style={{ boxShadow: `0 0 30px ${entry.color}10` }}
                whileHover={{ scale: 1.01 }}
                onClick={() => toggle(entry.id)}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
                    <span className="text-sm font-semibold text-foreground/90 truncate">{entry.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); toggleBlitz(); }}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-accent/15 text-accent border border-accent/25 transition-all hover:bg-accent/25 flex-shrink-0"
                  >
                    <Zap size={10} /> Burst
                  </button>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mb-3 text-[11px] text-muted/50">
                  <span>{entry.tasks.length} tasks</span>
                  <span>·</span>
                  <span>{formatMinutes(totalEstimated)}</span>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: entry.color }} />
                    </div>
                    <span>{doneTasks}/{total}</span>
                  </div>
                </div>

                {/* Preview tasks (up to 3) */}
                <div className="flex flex-col gap-1">
                  {previewTasks.map(t => (
                    <div key={t.id} className="text-xs text-muted/60 truncate flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
                      {t.title}
                    </div>
                  ))}
                  {entry.tasks.length > 3 && (
                    <div className="text-[10px] text-muted/30 mt-0.5">+{entry.tasks.length - 3} more</div>
                  )}
                  {entry.tasks.length === 0 && (
                    <div className="text-[10px] text-muted/25 italic">No active tasks</div>
                  )}
                </div>
              </motion.div>

              {/* Expanded task list (accordion below card) */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border border-white/[0.05] border-t-0 rounded-b-2xl bg-black/30 px-3 py-2 flex flex-col gap-0.5">
                      {entry.tasks.length === 0 ? (
                        <div className="text-xs text-muted/30 text-center py-3">No active tasks in this zone</div>
                      ) : (
                        entry.tasks.map(task => (
                          <TaskItem key={task.id} task={task} onComplete={completeTask} />
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {zoneEntries.length === 0 && (
        <div className="text-center py-12 text-muted/30">
          <Layers size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No zones yet</p>
          <p className="text-xs mt-1">Create a zone to group your tasks by context</p>
        </div>
      )}
    </div>
  );
}
