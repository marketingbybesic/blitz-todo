import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskItem } from '../TaskItem';

export function ZonesView() {
  const tasks = useTaskStore((state) => state.tasks);
  const zones = useTaskStore((state) => state.zones);
  const loadZones = useTaskStore((state) => state.loadZones);
  const addZone = useTaskStore((state) => state.addZone);
  const completeTask = useTaskStore((state) => state.completeTask);

  const [newZoneName, setNewZoneName] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const grouped = useMemo(() => {
    const map = new Map<string | null, typeof tasks>();
    for (const task of tasks) {
      if (task.status === 'done') continue;
      const key = task.zoneId ?? null;
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const toggleExpand = (zoneId: string | null) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const key = zoneId ?? 'uncategorized';
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAddZone = async () => {
    if (!newZoneName.trim()) return;
    await addZone(newZoneName.trim());
    setNewZoneName('');
  };

  const zoneEntries = useMemo(() => {
    const entries = zones.map((z) => ({
      id: z.id,
      name: z.name,
      tasks: grouped.get(z.id) ?? [],
    }));
    const uncategorized = grouped.get(null) ?? [];
    if (uncategorized.length > 0) {
      entries.push({
        id: 'uncategorized',
        name: 'Uncategorized',
        tasks: uncategorized,
      });
    }
    return entries;
  }, [zones, grouped]);

  return (
    <div className="max-w-3xl mx-auto pt-12 px-8">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Zones</h1>

      <div className="flex items-center gap-2 mb-6">
        <input
          type="text"
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddZone();
          }}
          placeholder="Create new zone..."
          className="flex-1 bg-card border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
        <button
          type="button"
          onClick={handleAddZone}
          className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors"
        >
          Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {zoneEntries.map((entry) => {
          const isExpanded = expanded.has(entry.id === 'uncategorized' ? 'uncategorized' : entry.id);
          return (
            <div key={entry.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => toggleExpand(entry.id === 'uncategorized' ? null : entry.id)}
                className="flex items-center gap-2 p-3 rounded-lg bg-card/30 border border-white/5 hover:bg-card/50 transition-colors text-left"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-muted" />
                ) : (
                  <ChevronRight size={16} className="text-muted" />
                )}
                <span className="text-sm font-medium text-foreground/90">{entry.name}</span>
                <span className="text-xs text-muted ml-auto tabular-nums">
                  {entry.tasks.length} task{entry.tasks.length === 1 ? '' : 's'}
                </span>
              </button>

              {isExpanded && (
                <div className="flex flex-col gap-0.5 mt-1 ml-8">
                  {entry.tasks.length === 0 ? (
                    <div className="text-xs text-muted/40 py-2">No tasks in this zone</div>
                  ) : (
                    entry.tasks.map((task) => (
                      <TaskItem key={task.id} task={task} onComplete={completeTask} />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {zoneEntries.length === 0 && (
          <div className="text-sm text-muted/60 tracking-wide">
            No zones yet. Create one above to start organizing.
          </div>
        )}
      </div>
    </div>
  );
}
