import { useMemo, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Target, Zap, Brain, BarChart3, Minus, Plus, Circle, CheckCircle2, Trash2, ChevronDown, Wand2, Loader2, Sparkles, Clock } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { RichTextEditor } from './RichTextEditor';

const GOOGLE_KEY = 'AIzaSyDPW0tks9GLHaT4Tk4NJBofUqz1qH8NgpE';

async function gemini(prompt: string): Promise<string> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_KEY}`,
    { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{maxOutputTokens:512} }) }
  );
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export function TaskDetailPane() {
  const tasks               = useTaskStore(s => s.tasks);
  const zones               = useTaskStore(s => s.zones);
  const selectedTaskId      = useTaskStore(s => s.selectedTaskId);
  const setSelectedTaskId   = useTaskStore(s => s.setSelectedTaskId);
  const updateTask          = useTaskStore(s => s.updateTask);
  const deleteTask          = useTaskStore(s => s.deleteTask);
  const addChecklistItem    = useTaskStore(s => s.addChecklistItem);
  const toggleChecklistItem = useTaskStore(s => s.toggleChecklistItem);
  const deleteChecklistItem = useTaskStore(s => s.deleteChecklistItem);

  const task = useMemo(() => tasks.find(t => t.id === selectedTaskId) ?? null, [tasks, selectedTaskId]);

  const [title, setTitle]               = useState('');
  const [newItem, setNewItem]           = useState('');
  const [aiLoading, setAiLoading]       = useState<'subtasks'|'time'|null>(null);
  const [aiHint, setAiHint]             = useState<string|null>(null);

  useEffect(() => { if (task) { setTitle(task.title); setNewItem(''); setAiHint(null); } }, [task?.id]);

  const fmt = (m: number) => {
    const h = Math.floor(m/60), min = m%60;
    if (h > 0 && min > 0) return `${h}h ${String(min).padStart(2,'0')}m`;
    if (h > 0) return `${h}h`;
    return `${min}m`;
  };

  const aiSubtasks = useCallback(async () => {
    if (!task) return;
    setAiLoading('subtasks');
    try {
      const resp = await gemini(`Break this task into 3-6 concrete subtasks. Task: "${task.title}". Context: ${task.content?.replace(/<[^>]*>/g,'') || 'none'}. Return ONLY a JSON array: ["subtask 1","subtask 2"]`);
      const match = resp.match(/\[[\s\S]*?\]/);
      if (match) {
        const items: string[] = JSON.parse(match[0]);
        for (const s of items) await addChecklistItem(task.id, s);
        setAiHint(`✓ Generated ${items.length} subtasks`);
      }
    } catch { setAiHint('AI error — try again'); }
    finally { setAiLoading(null); setTimeout(() => setAiHint(null), 3000); }
  }, [task, addChecklistItem]);

  const aiEstimate = useCallback(async () => {
    if (!task) return;
    setAiLoading('time');
    try {
      const resp = await gemini(`Estimate the time (in minutes) to complete this task for a professional. Task: "${task.title}". Subtasks: ${(task.checklist||[]).map(i=>i.title).join(', ')||'none'}. Return ONLY a JSON object: {"minutes": 45, "reason": "short explanation"}`);
      const match = resp.match(/\{[\s\S]*?\}/);
      if (match) {
        const { minutes, reason } = JSON.parse(match[0]);
        if (minutes && minutes > 0) {
          await updateTask(task.id, { estimatedMinutes: Math.round(minutes/15)*15 });
          setAiHint(`✓ ${fmt(minutes)} — ${reason}`);
        }
      }
    } catch { setAiHint('AI error — try again'); }
    finally { setAiLoading(null); setTimeout(() => setAiHint(null), 5000); }
  }, [task, updateTask]);

  const IMPACT_COLORS: Record<string, string> = { high: 'text-accent', medium: 'text-blue-400', low: 'text-muted' };
  const STATUS_COLORS: Record<string, string>  = { todo: 'text-muted/60', in_progress: 'text-orange-400', done: 'text-green-400' };

  const close = () => setSelectedTaskId(null);

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div key="backdrop" className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />

          <motion.div key="panel"
            className="fixed right-0 top-0 h-screen w-full md:w-[680px] bg-black border-l border-white/[0.07] z-50 shadow-[−40px_0_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0 bg-black/80 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${IMPACT_COLORS[task.impact ?? 'medium'].replace('text-', 'bg-')}`} />
                <span className="text-[10px] font-semibold text-muted/50 uppercase tracking-widest">Task</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { deleteTask(task.id); close(); }}
                  className="p-1.5 rounded-lg text-muted/30 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                  <Trash2 size={14} />
                </button>
                <button type="button" onClick={close}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.05] transition-colors">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left — content */}
              <div className="flex-[3] min-w-0 overflow-y-auto p-5 flex flex-col gap-5">
                <input type="text" value={title}
                  onChange={e => { setTitle(e.target.value); updateTask(task.id, { title: e.target.value }); }}
                  className="text-xl font-bold bg-transparent text-foreground placeholder:text-muted/20 focus:outline-none w-full"
                  placeholder="Task title" />

                {/* AI hint */}
                <AnimatePresence>
                  {aiHint && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-[11px] text-accent bg-accent/8 border border-accent/15 px-3 py-2 rounded-lg">
                      <Sparkles size={11} />{aiHint}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-2 block">Notes</label>
                  <RichTextEditor content={task.content || ''} onChange={html => updateTask(task.id, { content: html })} />
                </div>

                {/* Subtasks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest">
                      Subtasks · {(task.checklist||[]).filter(i=>i.isDone).length}/{(task.checklist||[]).length}
                    </label>
                    <button type="button" onClick={aiSubtasks} disabled={aiLoading !== null}
                      className="flex items-center gap-1 text-[10px] text-accent/60 hover:text-accent transition-colors disabled:opacity-30">
                      {aiLoading === 'subtasks' ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                      AI Break Down
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {(task.checklist || []).map(item => (
                      <div key={item.id} className="group flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                        <button type="button" onClick={() => toggleChecklistItem(task.id, item.id)} className="flex-shrink-0">
                          {item.isDone
                            ? <CheckCircle2 size={15} className="text-accent" />
                            : <Circle size={15} className="text-muted/30 group-hover:text-muted/50 transition-colors" />}
                        </button>
                        <span className={`flex-1 text-sm leading-relaxed ${item.isDone ? 'text-muted/30 line-through' : 'text-foreground/80'}`}>{item.title}</span>
                        <button type="button" onClick={() => deleteChecklistItem(task.id, item.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted/30 hover:text-red-400 transition-all">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <input type="text" value={newItem}
                      onChange={e => setNewItem(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { addChecklistItem(task.id, newItem.trim()); setNewItem(''); } }}
                      placeholder="Add subtask  ↵"
                      className="w-full bg-transparent border-b border-white/[0.06] focus:border-accent/30 pb-1.5 text-sm text-foreground placeholder:text-muted/20 focus:outline-none transition-colors mt-1 px-2" />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px shrink-0 bg-white/[0.04]" />

              {/* Right — metadata */}
              <div className="flex-[2] min-w-0 overflow-y-auto p-5 flex flex-col gap-4 bg-white/[0.01]">
                {/* Status */}
                <div>
                  <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-2 block">Status</label>
                  <div className="flex gap-1.5">
                    {(['todo','in_progress','done'] as const).map(s => {
                      const labels = { todo:'To Do', in_progress:'In Progress', done:'Done' };
                      const active = task.status === s;
                      return (
                        <button key={s} type="button" onClick={() => updateTask(task.id, { status: s })}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                            active ? `${STATUS_COLORS[s]} border-current bg-current/8` : 'text-muted/40 border-transparent hover:border-white/10 hover:text-muted/70'
                          }`}>{labels[s]}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Energy */}
                <div>
                  <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-2 block">Energy</label>
                  <div className="flex gap-1.5">
                    {[{v:'deep-work' as const,l:'Deep',i:Brain},{v:'light-work' as const,l:'Light',i:Zap}].map(({v,l,i:Icon}) => (
                      <button key={v} type="button" onClick={() => updateTask(task.id, { energyLevel: v })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                          task.energyLevel === v ? 'bg-accent/12 text-accent border-accent/25' : 'text-muted/50 border-transparent hover:border-white/10 hover:text-muted/80 bg-white/[0.02]'
                        }`}><Icon size={13}/>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Impact */}
                <div>
                  <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-2 block">Impact</label>
                  <div className="flex gap-1.5">
                    {(['low','medium','high'] as const).map(v => (
                      <button key={v} type="button" onClick={() => updateTask(task.id, { impact: v })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium capitalize transition-all border ${
                          task.impact === v ? `${IMPACT_COLORS[v]} border-current bg-current/8` : 'text-muted/50 border-transparent hover:border-white/10 hover:text-muted/80 bg-white/[0.02]'
                        }`}><BarChart3 size={12}/>{v}</button>
                    ))}
                  </div>
                </div>

                {/* Time estimate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest">Estimate</label>
                    <button type="button" onClick={aiEstimate} disabled={aiLoading !== null}
                      className="flex items-center gap-1 text-[10px] text-accent/60 hover:text-accent transition-colors disabled:opacity-30">
                      {aiLoading === 'time' ? <Loader2 size={10} className="animate-spin" /> : <Clock size={10} />}
                      AI Estimate
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateTask(task.id, { estimatedMinutes: Math.max(5, (task.estimatedMinutes ?? 15) - 15) })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted hover:text-accent hover:border-accent/30 transition-all active:scale-95">
                      <Minus size={14} />
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold tabular-nums">{fmt(task.estimatedMinutes ?? 15)}</span>
                    <button type="button" onClick={() => updateTask(task.id, { estimatedMinutes: Math.min(480, (task.estimatedMinutes ?? 15) + 15) })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted hover:text-accent hover:border-accent/30 transition-all active:scale-95">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Target */}
                <button type="button" onClick={() => updateTask(task.id, { isTarget: !task.isTarget })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                    task.isTarget ? 'bg-accent/12 text-accent border-accent/25 shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_15%,transparent)]' : 'bg-white/[0.02] text-muted/50 border-transparent hover:border-white/10 hover:text-muted/80'
                  }`}>
                  <Target size={13} />{task.isTarget ? 'Active Target ✓' : 'Set as Target'}
                </button>

                {/* Zone */}
                <div>
                  <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-2 block">Zone</label>
                  <div className="relative">
                    <select value={task.zoneId || ''} onChange={e => updateTask(task.id, { zoneId: e.target.value || undefined })}
                      className="w-full appearance-none bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-foreground/70 focus:outline-none focus:border-accent/30 cursor-pointer">
                      <option value="">No Zone</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/30 pointer-events-none" />
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-2 block">Due Date</label>
                  <input type="datetime-local"
                    value={task.dueDate ? task.dueDate.slice(0,16) : ''}
                    onChange={e => updateTask(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-foreground/70 focus:outline-none focus:border-accent/30" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
