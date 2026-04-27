import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, FolderPlus, Loader2, CheckCircle2, Wand2 } from 'lucide-react';
import { TaskItem } from '../TaskItem';
import { useTaskStore } from '../../store/useTaskStore';
import { calculatePriority } from '../../lib/priority';
import { Typewriter } from '../Typewriter';

const GOOGLE_KEY = 'AIzaSyDPW0tks9GLHaT4Tk4NJBofUqz1qH8NgpE';

async function callGemini(prompt: string): Promise<string> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1024 } }) }
  );
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function parseDumpText(raw: string): string[] {
  // Split on ; or newlines, filter empty
  return raw
    .split(/[;\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);
}

export function BrainDumpView() {
  const tasks       = useTaskStore(s => s.tasks);
  const loadTasks   = useTaskStore(s => s.loadTasks);
  const addTask     = useTaskStore(s => s.addTask);
  const addZone     = useTaskStore(s => s.addZone);
  const completeTask = useTaskStore(s => s.completeTask);
  const sorted      = useTaskStore(s => s.brainDumpSorted);

  const [dumpText, setDumpText] = useState('');
  const [aiLoading, setAiLoading] = useState<'tasks' | 'projects' | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Auto-detect ; or newlines and show preview
  useEffect(() => {
    const lines = parseDumpText(dumpText);
    setPreview(lines.length > 1 ? lines : []);
  }, [dumpText]);

  const submitDump = useCallback(async () => {
    const lines = parseDumpText(dumpText);
    if (lines.length === 0) return;
    for (const title of lines) {
      await addTask({ title, energyLevel: 'light-work', estimatedMinutes: 15, isTarget: false, status: 'todo', impact: 'medium', dueDate: undefined, content: undefined, zoneId: undefined, startDate: undefined, checklist: [] });
    }
    setDumpText(''); setPreview([]);
    setAiResult(`✓ Added ${lines.length} task${lines.length !== 1 ? 's' : ''}`);
    setTimeout(() => setAiResult(null), 2500);
  }, [dumpText, addTask]);

  const generateTasks = useCallback(async () => {
    const text = dumpText.trim();
    if (!text) return;
    setAiLoading('tasks');
    try {
      const prompt = `You are a productivity assistant for someone with ADHD. Convert this brain dump into specific, actionable tasks. Each task should be concrete and completable in one session.

Brain dump: "${text}"

Return ONLY a JSON array of task title strings. Max 8 tasks. Be specific and action-oriented. Format: ["task 1", "task 2"]`;
      const resp = await callGemini(prompt);
      const match = resp.match(/\[[\s\S]*?\]/);
      if (match) {
        const taskTitles: string[] = JSON.parse(match[0]);
        for (const title of taskTitles) {
          await addTask({ title, energyLevel: 'light-work', estimatedMinutes: 20, isTarget: false, status: 'todo', impact: 'medium', dueDate: undefined, content: undefined, zoneId: undefined, startDate: undefined, checklist: [] });
        }
        setDumpText('');
        setAiResult(`✓ Generated ${taskTitles.length} tasks from your dump`);
        setTimeout(() => setAiResult(null), 3000);
      }
    } catch (e) { setAiResult('Error — check your connection'); setTimeout(() => setAiResult(null), 3000); }
    finally { setAiLoading(null); }
  }, [dumpText, addTask]);

  const generateProjects = useCallback(async () => {
    const text = dumpText.trim();
    if (!text) return;
    setAiLoading('projects');
    try {
      const prompt = `You are a project manager for someone with ADHD. Analyze this brain dump and identify distinct projects or areas of work.

Brain dump: "${text}"

Return ONLY a JSON object with project names as keys and arrays of task titles as values. Max 3 projects, 4 tasks each. Format:
{"Project Name": ["task 1", "task 2"], "Project 2": ["task 1"]}`;
      const resp = await callGemini(prompt);
      const match = resp.match(/\{[\s\S]*?\}/);
      if (match) {
        const projects: Record<string, string[]> = JSON.parse(match[0]);
        let totalTasks = 0;
        for (const [projectName, taskTitles] of Object.entries(projects)) {
          await addZone(projectName);
          // Load zones to get the new zone ID
          const { zones } = useTaskStore.getState();
          const zone = zones.find(z => z.name === projectName);
          for (const title of taskTitles) {
            await addTask({ title, energyLevel: 'light-work', estimatedMinutes: 25, isTarget: false, status: 'todo', impact: 'medium', dueDate: undefined, content: undefined, zoneId: zone?.id, startDate: undefined, checklist: [] });
            totalTasks++;
          }
        }
        setDumpText('');
        setAiResult(`✓ Created ${Object.keys(projects).length} projects, ${totalTasks} tasks`);
        setTimeout(() => setAiResult(null), 3500);
      }
    } catch (e) { setAiResult('Error generating projects'); setTimeout(() => setAiResult(null), 3000); }
    finally { setAiLoading(null); }
  }, [dumpText, addTask, addZone]);

  const chaosTasks = tasks.filter(t => t.status !== 'done' && !t.startDate && !t.dueDate);
  const displayTasks = sorted ? [...chaosTasks].sort((a, b) => calculatePriority(b) - calculatePriority(a)) : chaosTasks;

  return (
    <div className="max-w-3xl mx-auto pt-10 px-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Brain Dump</h1>
          <p className="text-xs text-muted mt-0.5">Capture anything. AI will organise it.</p>
        </div>
      </div>

      {/* Dump input */}
      <div className="relative mb-4">
        <textarea
          ref={textareaRef}
          value={dumpText}
          onChange={e => setDumpText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitDump(); }
          }}
          placeholder="Start typing anything... use ; or new lines to separate multiple tasks"
          rows={4}
          className="w-full bg-card/60 border border-white/[0.08] rounded-xl px-4 py-3.5 dark:bg-card/60 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/40 focus:bg-card/60 resize-none transition-all backdrop-blur-sm leading-relaxed"
        />

        {/* Preview of parsed tasks */}
        <AnimatePresence>
          {preview.length > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 px-3 py-2 bg-accent/5 border border-accent/15 rounded-lg"
            >
              <div className="text-[10px] font-semibold text-accent/70 uppercase tracking-widest mb-1.5">
                {preview.length} tasks detected
              </div>
              {preview.slice(0, 5).map((t, i) => (
                <div key={i} className="text-xs text-muted flex items-center gap-1.5 py-0.5">
                  <div className="w-1 h-1 rounded-full bg-accent/40" />
                  {t}
                </div>
              ))}
              {preview.length > 5 && <div className="text-[10px] text-muted/40 mt-1">+{preview.length - 5} more</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-8">
        {dumpText.trim() && (
          <button type="button" onClick={submitDump}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-background hover:opacity-90 active:scale-95 transition-all shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_25%,transparent)]">
            <CheckCircle2 size={13} />
            Add {preview.length > 1 ? `${preview.length} Tasks` : 'Task'}
          </button>
        )}
        <button type="button" onClick={generateTasks} disabled={!dumpText.trim() || aiLoading !== null}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-card border border-border hover:border-accent/30 hover:text-accent text-muted disabled:opacity-40 transition-all backdrop-blur-sm">
          {aiLoading === 'tasks' ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
          Generate Tasks
        </button>
        <button type="button" onClick={generateProjects} disabled={!dumpText.trim() || aiLoading !== null}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-card border border-border hover:border-accent/30 hover:text-accent text-muted disabled:opacity-40 transition-all backdrop-blur-sm">
          {aiLoading === 'projects' ? <Loader2 size={13} className="animate-spin" /> : <FolderPlus size={13} />}
          Generate Projects
        </button>
        <div className="text-[10px] text-muted/40 ml-auto">⌘↵ to add</div>
      </div>

      {/* AI result toast */}
      <AnimatePresence>
        {aiResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
            <Sparkles size={13} />
            {aiResult}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing brain dump tasks */}
      {chaosTasks.length === 0 ? (
        <div className="text-sm text-muted/50"><Typewriter /></div>
      ) : (
        <div>
          <div className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-3">
            Unscheduled · {chaosTasks.length}
          </div>
          <div className="flex flex-col gap-1">
            {displayTasks.map(task => <TaskItem key={task.id} task={task} onComplete={completeTask} />)}
          </div>
        </div>
      )}
    </div>
  );
}
