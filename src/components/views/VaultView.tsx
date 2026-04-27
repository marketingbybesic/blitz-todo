import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useTaskStore } from '../../store/useTaskStore';
import { db } from '../../lib/db';
import { TaskSchema, ZoneSchema, ReflectionSchema } from '../../types';
import {
  Download, Upload, CheckCircle, AlertCircle,
  ListChecks, Layers, ArchiveRestore, Database,
} from 'lucide-react';

const BackupSchema = z.object({
  version: z.number().optional(),
  exportedAt: z.string().optional(),
  tasks: z.array(TaskSchema),
  zones: z.array(ZoneSchema).optional(),
  reflections: z.array(ReflectionSchema).optional(),
});

export async function exportData(): Promise<void> {
  const [tasks, zones, reflections] = await Promise.all([
    db.tasks.toArray(),
    db.zones.toArray(),
    db.reflections.toArray(),
  ]);

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    zones,
    reflections,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `blitz-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<boolean> {
  let json: unknown;
  try {
    const text = await file.text();
    json = JSON.parse(text);
  } catch {
    return false;
  }

  const parsed = BackupSchema.safeParse(json);
  if (!parsed.success) return false;

  const { tasks, zones, reflections } = parsed.data;

  await db.transaction('rw', db.tasks, db.zones, db.reflections, async () => {
    await db.tasks.clear();
    await db.tasks.bulkAdd(tasks);
    if (zones) { await db.zones.clear(); await db.zones.bulkAdd(zones); }
    if (reflections) { await db.reflections.clear(); await db.reflections.bulkAdd(reflections); }
  });

  return true;
}

type ToastState =
  | { type: 'idle' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

export function VaultView() {
  const tasks = useTaskStore((state) => state.tasks);
  const zones = useTaskStore((state) => state.zones);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const loadZones = useTaskStore((state) => state.loadZones);
  const updateTask = useTaskStore((state) => state.updateTask);
  const [toast, setToast] = useState<ToastState>({ type: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadTasks(); loadZones(); }, [loadTasks, loadZones]);

  useEffect(() => {
    if (toast.type === 'idle') return;
    const timer = setTimeout(() => setToast({ type: 'idle' }), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const completedTasks = tasks.filter((t) => t.status === 'done');
  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const activeZones = zones.filter((z) =>
    tasks.some((t) => t.zoneId === z.id && t.status !== 'done')
  );

  const handleExport = async () => {
    await exportData();
    setToast({ type: 'success', message: 'Backup downloaded successfully.' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await importData(file);
    if (ok) {
      await loadTasks();
      await loadZones();
      setToast({ type: 'success', message: 'Backup restored successfully.' });
    } else {
      setToast({ type: 'error', message: 'Import failed: invalid or corrupted backup file.' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestoreTask = async (id: string) => {
    await updateTask(id, { status: 'todo', completedAt: undefined });
  };

  const cardClass = 'bg-black/50 border border-white/[0.06] rounded-2xl p-5';

  return (
    <div className="max-w-3xl mx-auto pt-10 px-6 pb-24">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">The Vault</h1>
        <p className="text-xs text-muted mt-0.5">Data management, backups, and completed tasks.</p>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast.type !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`flex items-center gap-2 mb-5 px-4 py-2.5 rounded-xl border text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                : 'bg-red-950/30 border-red-500/20 text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 1 — Overview stats */}
      <div className={`${cardClass} mb-4`}>
        <div className="flex items-center gap-2 mb-4">
          <Database size={14} className="text-accent/70" />
          <h2 className="text-sm font-semibold text-white/80">Overview</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <div className="text-2xl font-bold text-white/90">{tasks.length}</div>
            <div className="text-[10px] font-medium text-white/35 uppercase tracking-widest mt-0.5">Total Tasks</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <div className="text-2xl font-bold text-emerald-400">{completedTasks.length}</div>
            <div className="text-[10px] font-medium text-white/35 uppercase tracking-widest mt-0.5">Completed</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <div className="flex items-center gap-1.5">
              <ListChecks size={13} className="text-accent/60" />
              <div className="text-2xl font-bold text-white/90">{activeTasks.length}</div>
            </div>
            <div className="text-[10px] font-medium text-white/35 uppercase tracking-widest mt-0.5">Active Tasks</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <div className="flex items-center gap-1.5">
              <Layers size={13} className="text-accent/60" />
              <div className="text-2xl font-bold text-white/90">{activeZones.length}<span className="text-base text-white/30">/{zones.length}</span></div>
            </div>
            <div className="text-[10px] font-medium text-white/35 uppercase tracking-widest mt-0.5">Active Zones</div>
          </div>
        </div>
      </div>

      {/* Section 2 — Backup & Restore */}
      <div className={`${cardClass} mb-4`}>
        <div className="flex items-center gap-2 mb-4">
          <Download size={14} className="text-accent/70" />
          <h2 className="text-sm font-semibold text-white/80">Backup & Restore</h2>
        </div>
        <p className="text-xs text-white/35 mb-4 leading-relaxed">
          Export all your tasks, zones, and reflections as a JSON file. Import it on any device to restore your data.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-background text-xs font-semibold hover:opacity-90 transition-all"
          >
            <Download size={13} />
            Export Backup
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] text-white/60 border border-white/[0.08] text-xs font-semibold hover:text-white/90 hover:border-white/[0.15] transition-all"
          >
            <Upload size={13} />
            Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Section 3 — Completed Tasks */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={14} className="text-emerald-400/70" />
          <h2 className="text-sm font-semibold text-white/80">Completed Tasks</h2>
          <span className="ml-auto text-[10px] font-semibold text-white/25 bg-white/[0.05] px-2 py-0.5 rounded-full">
            {completedTasks.length}
          </span>
        </div>

        {completedTasks.length === 0 ? (
          <p className="text-xs text-white/25 text-center py-8">No completed tasks yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {completedTasks
              .slice()
              .sort((a, b) => {
                if (!a.completedAt && !b.completedAt) return 0;
                if (!a.completedAt) return 1;
                if (!b.completedAt) return -1;
                return b.completedAt.localeCompare(a.completedAt);
              })
              .map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group"
                >
                  <CheckCircle size={13} className="text-emerald-500/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/50 line-through truncate">{task.title}</p>
                    {task.completedAt && (
                      <p className="text-[10px] text-white/25 mt-0.5">{formatDate(task.completedAt)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestoreTask(task.id)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white/25 bg-white/[0.04] border border-white/[0.05] hover:text-white/70 hover:border-white/[0.12] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ArchiveRestore size={10} />
                    Restore
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
