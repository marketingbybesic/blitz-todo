import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Palette, Layout, Moon, Check, Save, Calendar, FolderSync, Bell, Timer, BarChart3, Upload, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { parseICal } from '../lib/ical';
import type { AIProvider } from '../lib/ai';

const ACCENT_PRESETS = [
  { label: 'Purple', color: '#a855f7' },
  { label: 'Blue',   color: '#3b82f6' },
  { label: 'Cyan',   color: '#06b6d4' },
  { label: 'Green',  color: '#22c55e' },
  { label: 'Orange', color: '#f97316' },
  { label: 'Pink',   color: '#ec4899' },
];

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  gemini: 'gemini-2.0-flash',
};

type Tab = 'appearance' | 'calendar' | 'sync' | 'focus' | 'data' | 'ai';

export function SettingsModal() {
  const isOpen   = useSettingsStore(s => s.isSettingsOpen);
  const toggle   = useSettingsStore(s => s.toggleSettingsModal);
  const accent   = useSettingsStore(s => s.accentColor);
  const setAccent = useSettingsStore(s => s.setAccentColor);
  const applyAccent = useSettingsStore(s => s.applyAccentColor);
  const fab      = useSettingsStore(s => s.fabAlignment);
  const setFab   = useSettingsStore(s => s.setFabAlignment);
  const theme    = useSettingsStore(s => s.theme);
  const setTheme = useSettingsStore(s => s.setTheme);
  const calName  = useSettingsStore(s => s.calendarName);
  const setCalendar = useSettingsStore(s => s.setCalendarEvents);
  const syncFolder  = useSettingsStore(s => s.syncFolder);
  const setSyncFolder = useSettingsStore(s => s.setSyncFolder);
  const notifications = useSettingsStore(s => s.notificationsEnabled);
  const toggleNotifs  = useSettingsStore(s => s.toggleNotifications);
  const pomodoroMins  = useSettingsStore(s => s.pomodoroMinutes);
  const setPomodoro   = useSettingsStore(s => s.setPomodoroMinutes);
  const showCompleted = useSettingsStore(s => s.showStatsAndCompleted);
  const toggleStats   = useSettingsStore(s => s.toggleStats);
  const streak     = useSettingsStore(s => s.streak);
  const focusPoints = useSettingsStore(s => s.focusPoints);
  const aiEnabled      = useSettingsStore(s => s.aiEnabled);
  const aiProvider     = useSettingsStore(s => s.aiProvider);
  const aiModel        = useSettingsStore(s => s.aiModel);
  const userApiKey     = useSettingsStore(s => s.userApiKey);
  const setUserApiKey  = useSettingsStore(s => s.setUserApiKey);
  const clearUserApiKey = useSettingsStore(s => s.clearUserApiKey);

  const [tab, setTab] = useState<Tab>('appearance');
  const [saved, setSaved] = useState(false);
  const [syncFolderInput, setSyncFolderInput] = useState(syncFolder);
  const calInputRef = useRef<HTMLInputElement>(null);

  // AI tab local state
  const [aiProviderInput, setAiProviderInput] = useState<AIProvider>(aiProvider);
  const [aiModelInput, setAiModelInput] = useState(aiModel || DEFAULT_MODELS[aiProvider]);
  const [aiKeyInput, setAiKeyInput] = useState(userApiKey);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) toggle(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, toggle]);

  const flash = (fn: () => void) => { fn(); setSaved(true); setTimeout(() => setSaved(false), 1500); };

  const handleCalImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const events = parseICal(text);
    setCalendar(JSON.stringify(events), file.name.replace('.ics',''));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'appearance', icon: <Palette size={14}/>, label: 'Look & Feel' },
    { id: 'focus',      icon: <Timer size={14}/>,   label: 'Focus' },
    { id: 'calendar',   icon: <Calendar size={14}/>, label: 'Calendar' },
    { id: 'sync',       icon: <FolderSync size={14}/>, label: 'Sync' },
    { id: 'data',       icon: <BarChart3 size={14}/>, label: 'Stats' },
    { id: 'ai',         icon: <Sparkles size={14}/>, label: 'AI' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xl flex items-start justify-center pt-[12vh]"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          onClick={e => { if (e.target === e.currentTarget) toggle(); }}>
          <motion.div className="w-full max-w-lg bg-black border border-white/[0.08] rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[76vh]"
            initial={{ opacity:0, scale:0.96, y:12 }} animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.96, y:12 }}
            transition={{ type:'spring', stiffness:360, damping:30 }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold">Settings</h3>
                <AnimatePresence>
                  {saved && (
                    <motion.span initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                      className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
                      <Check size={10}/> Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <button type="button" onClick={toggle}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.05] transition-colors">
                <X size={14}/>
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-white/[0.05] flex-shrink-0 px-2 pt-1 overflow-x-auto">
              {TABS.map(t => (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
                    tab === t.id ? 'text-accent border-accent' : 'text-muted/50 border-transparent hover:text-muted/80'
                  }`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-5">

              {/* APPEARANCE */}
              {tab === 'appearance' && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-3"><Moon size={13} className="text-muted"/><span className="text-xs font-semibold text-foreground/80">Theme</span></div>
                    <div className="flex gap-2">
                      {(['dark','midnight','light'] as const).map(t => (
                        <button key={t} type="button" onClick={() => flash(() => setTheme(t))}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${theme === t ? 'bg-accent/15 text-accent border-accent/30' : 'bg-white/[0.04] text-muted border-transparent hover:border-white/10 hover:text-foreground'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3"><Palette size={13} className="text-muted"/><span className="text-xs font-semibold text-foreground/80">Accent Color</span></div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {ACCENT_PRESETS.map(p => (
                        <button key={p.color} type="button" onClick={() => flash(() => { setAccent(p.color); applyAccent(p.color); })} title={p.label}
                          className="w-7 h-7 rounded-full transition-all border-2 flex items-center justify-center"
                          style={{ background: p.color, borderColor: accent === p.color ? p.color : 'transparent', boxShadow: accent === p.color ? `0 0 10px ${p.color}60` : 'none' }}>
                          {accent === p.color && <Check size={12} color="#fff" strokeWidth={3}/>}
                        </button>
                      ))}
                      <input type="color" value={accent} title="Custom" onChange={e => flash(() => { setAccent(e.target.value); applyAccent(e.target.value); })}
                        className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent p-0 overflow-hidden"/>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3"><Layout size={13} className="text-muted"/><span className="text-xs font-semibold text-foreground/80">FAB Position</span></div>
                    <div className="flex gap-2">
                      {(['left','right'] as const).map(a => (
                        <button key={a} type="button" onClick={() => flash(() => setFab(a))}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${fab === a ? 'bg-accent/15 text-accent border-accent/30' : 'bg-white/[0.04] text-muted border-transparent hover:border-white/10 hover:text-foreground'}`}>{a}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* FOCUS */}
              {tab === 'focus' && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-3"><Timer size={13} className="text-muted"/><span className="text-xs font-semibold text-foreground/80">Pomodoro Length</span></div>
                    <div className="flex gap-2">
                      {[15,20,25,30,45,60].map(m => (
                        <button key={m} type="button" onClick={() => flash(() => setPomodoro(m))}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${pomodoroMins === m ? 'bg-accent/15 text-accent border-accent/30' : 'bg-white/[0.04] text-muted border-transparent hover:border-white/10 hover:text-foreground'}`}>{m}m</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div>
                      <p className="text-sm font-medium">Notifications</p>
                      <p className="text-[10px] text-muted/50 mt-0.5">Timer end + task reminders</p>
                    </div>
                    <button type="button" onClick={() => flash(toggleNotifs)}
                      className={`w-9 h-5 rounded-full relative transition-colors ${notifications ? 'bg-accent' : 'bg-white/10'}`}>
                      <motion.div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white"
                        animate={{ x: notifications ? 16 : 0 }} transition={{ type:'spring', stiffness:500, damping:30 }}/>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div>
                      <p className="text-sm font-medium">Show Completed Tasks</p>
                      <p className="text-[10px] text-muted/50 mt-0.5">Display done tasks in all views</p>
                    </div>
                    <button type="button" onClick={() => flash(toggleStats)}
                      className={`w-9 h-5 rounded-full relative transition-colors ${showCompleted ? 'bg-accent' : 'bg-white/10'}`}>
                      <motion.div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white"
                        animate={{ x: showCompleted ? 16 : 0 }} transition={{ type:'spring', stiffness:500, damping:30 }}/>
                    </button>
                  </div>
                </>
              )}

              {/* CALENDAR */}
              {tab === 'calendar' && (
                <>
                  <div className="text-xs text-muted/50 leading-relaxed bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                    Import a <code className="text-accent/70">.ics</code> calendar file to see your events in the Timeline. Works with Google Calendar, Apple Calendar, Outlook and any CalDAV provider.
                  </div>
                  <div>
                    <button type="button" onClick={() => calInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/12 border border-accent/25 text-sm font-semibold text-accent hover:bg-accent/20 transition-all">
                      <Upload size={15}/> Import .ics Calendar File
                    </button>
                    <input ref={calInputRef} type="file" accept=".ics" onChange={handleCalImport} className="hidden"/>
                  </div>
                  {calName && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-green-400/8 border border-green-400/20 rounded-xl">
                      <Check size={13} className="text-green-400"/>
                      <div>
                        <p className="text-xs font-medium text-green-400">{calName}</p>
                        <p className="text-[10px] text-muted/50">Calendar imported — events visible in Timeline</p>
                      </div>
                      <button type="button" onClick={() => { setCalendar('', ''); }}
                        className="ml-auto text-muted/40 hover:text-foreground transition-colors"><X size={12}/></button>
                    </div>
                  )}
                  <div className="text-[10px] text-muted/30 leading-relaxed">
                    To export from Google Calendar: Calendar settings → Export → download .ics file<br/>
                    Apple Calendar: File → Export → Export… (saves .ics)
                  </div>
                </>
              )}

              {/* SYNC */}
              {tab === 'sync' && (
                <>
                  <div className="text-xs text-muted/50 leading-relaxed bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                    Blitz is local-first — your data lives in IndexedDB. For cross-device sync, set a folder path and use <strong className="text-foreground/70">Syncthing</strong> (free, open-source) or Dropbox to sync it.
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-2 block">Sync Folder Path</label>
                    <div className="flex gap-2">
                      <input type="text" value={syncFolderInput} onChange={e => setSyncFolderInput(e.target.value)}
                        placeholder="/Users/you/Blitz Sync"
                        className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-foreground/80 placeholder:text-muted/30 focus:outline-none focus:border-accent/30 font-mono"/>
                      <button type="button" onClick={() => flash(() => setSyncFolder(syncFolderInput))}
                        className="px-3 py-2 rounded-xl bg-accent/12 border border-accent/25 text-xs font-semibold text-accent hover:bg-accent/20 transition-all">
                        <Save size={12}/>
                      </button>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 space-y-3 text-xs text-muted/60">
                    <p className="font-semibold text-foreground/70">How to set up Syncthing:</p>
                    <ol className="list-decimal list-inside space-y-1.5 ml-1">
                      <li>Install Syncthing on all devices (syncthing.net — free)</li>
                      <li>Set the folder above on each device</li>
                      <li>Blitz auto-exports backups there when you use The Vault</li>
                      <li>Import on other devices with The Vault → Import Backup</li>
                    </ol>
                  </div>
                </>
              )}

              {/* AI */}
              {tab === 'ai' && (
                <>
                  {/* Status badge */}
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium ${
                    aiEnabled
                      ? 'bg-green-400/8 border-green-400/20 text-green-400'
                      : 'bg-amber-400/8 border-amber-400/20 text-amber-400'
                  }`}>
                    <Sparkles size={12}/>
                    {aiEnabled ? 'AI Enhanced — using your API key' : 'Using built-in AI (rate limits may apply)'}
                  </div>

                  {/* Provider selector */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-2 block">Provider</label>
                    <div className="flex gap-2">
                      {(['openai', 'anthropic', 'gemini'] as AIProvider[]).map(p => (
                        <button key={p} type="button"
                          onClick={() => { setAiProviderInput(p); setAiModelInput(DEFAULT_MODELS[p]); }}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${
                            aiProviderInput === p
                              ? 'bg-accent/15 text-accent border-accent/30'
                              : 'bg-white/[0.04] text-muted border-transparent hover:border-white/10 hover:text-foreground'
                          }`}>
                          {p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : 'Gemini'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Model input */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-2 block">Model</label>
                    <input type="text" value={aiModelInput} onChange={e => setAiModelInput(e.target.value)}
                      placeholder={DEFAULT_MODELS[aiProviderInput]}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-foreground/80 placeholder:text-muted/30 focus:outline-none focus:border-accent/30 font-mono"/>
                  </div>

                  {/* API Key input */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted/40 uppercase tracking-widest mb-2 block">API Key</label>
                    <input type="password" value={aiKeyInput} onChange={e => setAiKeyInput(e.target.value)}
                      placeholder={aiProviderInput === 'openai' ? 'sk-...' : aiProviderInput === 'anthropic' ? 'sk-ant-...' : 'AIzaSy...'}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-foreground/80 placeholder:text-muted/30 focus:outline-none focus:border-accent/30 font-mono"/>
                  </div>

                  {/* Privacy note */}
                  <div className="text-[10px] text-muted/40 leading-relaxed bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                    Your key is stored locally and sent directly to the AI provider. Blitz never sees it.
                  </div>

                  {/* Save / Clear buttons */}
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => { if (aiKeyInput.trim()) { setUserApiKey(aiKeyInput.trim(), aiProviderInput, aiModelInput || DEFAULT_MODELS[aiProviderInput]); setSaved(true); setTimeout(() => setSaved(false), 1500); } }}
                      disabled={!aiKeyInput.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent/12 border border-accent/25 text-xs font-semibold text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <Save size={12}/> Save Key
                    </button>
                    {aiEnabled && (
                      <button type="button"
                        onClick={() => { clearUserApiKey(); setAiKeyInput(''); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
                        className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-muted/60 hover:text-red-400 hover:border-red-400/20 transition-all">
                        Clear
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* STATS */}
              {tab === 'data' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-orange-400">{streak}</div>
                      <div className="text-[10px] text-muted/50 mt-1 uppercase tracking-widest">Day Streak</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-accent">{focusPoints}</div>
                      <div className="text-[10px] text-muted/50 mt-1 uppercase tracking-widest">Focus XP</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted/40 text-center">
                    +10 XP per day active · +5 XP per task completed
                  </div>
                  <div className="h-px bg-white/[0.05]"/>
                  <div className="text-[10px] text-muted/30 text-center flex items-center gap-1 justify-center">
                    <Save size={9}/> All settings save automatically
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
