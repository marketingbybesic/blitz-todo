import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, Play, X, ArrowRight, RotateCcw, Sparkles, ChevronRight, Loader2, Target, Zap } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

const GOOGLE_KEY = 'AIzaSyDPW0tks9GLHaT4Tk4NJBofUqz1qH8NgpE';

async function gemini(prompt: string): Promise<string> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_KEY}`,
    { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{maxOutputTokens:1024} }) }
  );
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// Day slots for scheduling
const SLOTS = [
  { label: 'Morning', sub: '6–10am', icon: '🌅' },
  { label: 'Midday',  sub: '10am–2pm', icon: '☀️' },
  { label: 'Afternoon', sub: '2–6pm', icon: '🕒' },
  { label: 'Evening', sub: '6–10pm', icon: '🌙' },
];

export function MorningTriage() {
  const tasks              = useTaskStore(s => s.tasks);
  const zones              = useTaskStore(s => s.zones);
  const updateTask         = useTaskStore(s => s.updateTask);
  const isMorningTriageOpen = useTaskStore(s => s.isMorningTriageOpen);
  const dismissMorningTriage = useTaskStore(s => s.dismissMorningTriage);

  const [step, setStep]         = useState<'triage'|'plan'|'ai'>('triage');
  const [aiPlan, setAiPlan]     = useState<string|null>(null);
  const [aiLoading, setAiLoad]  = useState(false);
  const [scheduled, setScheduled] = useState<Record<string, string>>({});

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayISO    = now.toISOString();
  const tomorrowISO = (() => { const d = new Date(today); d.setDate(d.getDate()+1); return d.toISOString(); })();

  const overdue = useMemo(() => tasks.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate); d.setHours(0,0,0,0);
    return d < today && t.status !== 'done';
  }), [tasks, today]);

  const allActive = useMemo(() => tasks.filter(t => t.status !== 'done'), [tasks]);

  const handleAiSchedule = async () => {
    setAiLoad(true);
    try {
      const taskList = allActive.slice(0,10).map(t =>
        `- ${t.title} (${t.estimatedMinutes}min, ${t.impact} impact, ${t.energyLevel})`
      ).join('\n');
      const resp = await gemini(`You are an ADHD productivity coach. Schedule these tasks for today. Consider energy levels and ADHD time-blindness.

Tasks:
${taskList}

Available time slots: Morning (6-10am), Midday (10am-2pm), Afternoon (2-6pm), Evening (6-10pm)

Create a realistic, ADHD-friendly schedule. Start with the hardest task when energy is highest. Add breaks. Don't overschedule.

Return a clear, encouraging plain-text schedule (no JSON). Keep it short and actionable. Max 200 words.`);
      setAiPlan(resp);
      setStep('ai');
    } finally { setAiLoad(false); }
  };

  if (!isMorningTriageOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-2xl flex items-center justify-center p-4"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
        <motion.div
          className="w-full max-w-lg bg-black border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.9)]"
          initial={{ scale:0.96, y:16 }} animate={{ scale:1, y:0 }}
          exit={{ scale:0.96, y:16 }} transition={{ type:'spring', stiffness:320, damping:28 }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-sm font-bold">
                {step === 'triage' ? '⚡ Scheduling Wizard' : step === 'plan' ? '📅 Plan Your Day' : '🤖 AI Schedule'}
              </h2>
              <p className="text-[10px] text-muted/50 mt-0.5">
                {step === 'triage' && overdue.length > 0 ? `${overdue.length} task${overdue.length!==1?'s':''} need attention` :
                 step === 'triage' ? "You're all caught up! Plan your day." :
                 step === 'plan' ? 'Drag tasks to your preferred time slots' :
                 'AI-generated schedule for today'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {step !== 'triage' && (
                <button type="button" onClick={() => setStep('triage')}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.05] transition-colors">
                  <RotateCcw size={13} />
                </button>
              )}
              <button type="button" onClick={dismissMorningTriage}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.05] transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Step: Triage overdue */}
          {step === 'triage' && (
            <div>
              {overdue.length > 0 && (
                <div className="max-h-52 overflow-y-auto px-4 py-3 space-y-2">
                  {overdue.map(task => {
                    const zone = zones.find(z => z.id === task.zoneId);
                    return (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl group hover:border-white/10 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted/50 mt-0.5">
                            {zone && <span>{zone.name}</span>}
                            <span className="flex items-center gap-0.5"><Clock size={9}/>{task.estimatedMinutes}m</span>
                            {task.impact === 'high' && <span className="text-accent/70 flex items-center gap-0.5"><Target size={9}/>High</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => updateTask(task.id, { dueDate: todayISO })}
                            className="p-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors" title="Move to today">
                            <RotateCcw size={12} />
                          </button>
                          <button type="button" onClick={() => updateTask(task.id, { dueDate: tomorrowISO })}
                            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.05] transition-colors" title="Tomorrow">
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="px-5 py-4 border-t border-white/[0.05] flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setStep('plan')}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-muted hover:text-foreground hover:border-white/10 transition-all">
                    <Calendar size={14} /> Plan Day
                  </button>
                  <button type="button" onClick={handleAiSchedule} disabled={aiLoading}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent/12 border border-accent/25 text-sm font-medium text-accent hover:bg-accent/20 transition-all disabled:opacity-40">
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    AI Schedule
                  </button>
                </div>
                <button type="button" onClick={dismissMorningTriage}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_30%,transparent)]">
                  <Play size={13} />
                  {overdue.length > 0 ? 'Start the Day' : "Let's Go"}
                </button>
              </div>
            </div>
          )}

          {/* Step: Manual day planner */}
          {step === 'plan' && (
            <div>
              <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto">
                {SLOTS.map(slot => {
                  const slotTasks = allActive.filter(t => scheduled[t.id] === slot.label);
                  return (
                    <div key={slot.label} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3"
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        const tid = e.dataTransfer.getData('taskId');
                        if (tid) setScheduled(s => ({ ...s, [tid]: slot.label }));
                      }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span>{slot.icon}</span>
                        <span className="text-xs font-semibold">{slot.label}</span>
                        <span className="text-[10px] text-muted/40">{slot.sub}</span>
                        <span className="ml-auto text-[10px] text-muted/30">
                          {slotTasks.reduce((a,t) => a + t.estimatedMinutes, 0)}m planned
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-6">
                        {slotTasks.map(t => (
                          <div key={t.id} draggable onDragStart={e => e.dataTransfer.setData('taskId', t.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-accent/10 border border-accent/20 rounded-lg text-[10px] text-accent cursor-grab">
                            {t.estimatedMinutes}m · {t.title.slice(0,25)}
                          </div>
                        ))}
                        {slotTasks.length === 0 && (
                          <span className="text-[10px] text-muted/20">Drag tasks here</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-white/[0.05]">
                <p className="text-[10px] text-muted/40 mb-3 text-center">Drag tasks from your list into time slots</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {allActive.filter(t => !scheduled[t.id]).slice(0,8).map(t => (
                    <div key={t.id} draggable onDragStart={e => e.dataTransfer.setData('taskId', t.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[10px] text-muted/70 cursor-grab hover:border-white/10 transition-colors">
                      <Zap size={9} />{t.estimatedMinutes}m · {t.title.slice(0,20)}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={dismissMorningTriage}
                  className="w-full py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:opacity-90 transition-all">
                  Save & Start Day
                </button>
              </div>
            </div>
          )}

          {/* Step: AI Schedule result */}
          {step === 'ai' && aiPlan && (
            <div>
              <div className="px-5 py-4 max-h-60 overflow-y-auto">
                <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{aiPlan}</div>
              </div>
              <div className="px-5 py-4 border-t border-white/[0.05]">
                <button type="button" onClick={dismissMorningTriage}
                  className="w-full py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_30%,transparent)]">
                  <Play size={13} className="inline mr-1.5" />
                  Start Day
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
