import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { TaskItem } from '../TaskItem';
import { useTaskStore } from '../../store/useTaskStore';
import { QuoteGenerator } from '../QuoteGenerator';
import { Typewriter } from '../Typewriter';
import { db } from '../../lib/db';
import { TaskSchema, ZoneSchema, ReflectionSchema } from '../../types';
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';

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
  if (!parsed.success) {
    return false;
  }

  const { tasks, zones, reflections } = parsed.data;

  await db.transaction('rw', db.tasks, db.zones, db.reflections, async () => {
    await db.tasks.clear();
    await db.tasks.bulkAdd(tasks);
    if (zones) {
      await db.zones.clear();
      await db.zones.bulkAdd(zones);
    }
    if (reflections) {
      await db.reflections.clear();
      await db.reflections.bulkAdd(reflections);
    }
  });

  return true;
}

type ToastState =
  | { type: 'idle' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export function VaultView() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const loadZones = useTaskStore((state) => state.loadZones);
  const completeTask = useTaskStore((state) => state.completeTask);
  const [toast, setToast] = useState<ToastState>({ type: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (toast.type === 'idle') return;
    const timer = setTimeout(() => setToast({ type: 'idle' }), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const completedTasks = tasks.filter((t) => t.status === 'done');

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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-12 px-8">
      <h1 className="text-2xl font-bold tracking-tight mb-8">The Vault</h1>

      <QuoteGenerator />

      {/* Backup / Restore */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-white/10 text-xs font-medium text-foreground hover:border-accent/30 hover:text-accent transition-colors"
        >
          <Download size={14} />
          Export Backup
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-white/10 text-xs font-medium text-foreground hover:border-accent/30 hover:text-accent transition-colors"
        >
          <Upload size={14} />
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

      <AnimatePresence>
        {toast.type !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`flex items-center gap-2 mb-6 px-3 py-2 rounded-lg border text-xs font-medium ${
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

      <div className="w-full h-32 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/20 text-xs uppercase tracking-widest mb-6">
        Calendar Integration Coming Soon
      </div>

      {/* Completed Tasks */}
      <div>
        <label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-4 block">
          Completed Tasks
        </label>
        {completedTasks.length === 0 ? (
          <div className="text-sm text-muted/60 tracking-wide">
            <Typewriter />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} onComplete={completeTask} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
