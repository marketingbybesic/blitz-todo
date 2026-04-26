import { useState, useEffect } from 'react';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { useTaskStore }    from './store/useTaskStore';
import { useSettingsStore } from './store/useSettingsStore';
import { BlitzWidget }     from './components/BlitzWidget';
import { Sidebar }         from './components/Sidebar';
import { Dashboard }       from './components/Dashboard';
import { QuickCapture }    from './components/QuickCapture';
import { MobileNav }       from './components/MobileNav';
import { MorningTriage }   from './components/MorningTriage';
import { TaskDetailPane }  from './components/TaskDetailPane';
import { Toast }           from './components/Toast';
import { SettingsModal }   from './components/SettingsModal';
import { CommandPalette }  from './components/CommandPalette';
import { Onboarding }      from './components/Onboarding';

export default function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('blitz-onboarded'));

  const burstModeActive      = useTaskStore(s => s.burstModeActive);
  const currentView          = useTaskStore(s => s.currentView);
  const tasks                = useTaskStore(s => s.tasks);
  const morningTriageDismissed = useTaskStore(s => s.morningTriageDismissed);
  const openMorningTriage    = useTaskStore(s => s.openMorningTriage);
  const markMorningTriageChecked = useTaskStore(s => s.markMorningTriageChecked);
  const toggleCaptureModal   = useTaskStore(s => s.toggleCaptureModal);
  const loadTasks            = useTaskStore(s => s.loadTasks);
  const loadZones            = useTaskStore(s => s.loadZones);
  const checkAndUpdateStreak = useSettingsStore(s => s.checkAndUpdateStreak);

  // Boot data
  useEffect(() => {
    loadTasks();
    loadZones();
    checkAndUpdateStreak();
  }, [loadTasks, loadZones, checkAndUpdateStreak]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(p => !p);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === ' ') {
        e.preventDefault();
        toggleCaptureModal();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCaptureModal]);

  // Morning triage
  useEffect(() => {
    if (currentView === 'today' && !morningTriageDismissed) {
      const today = new Date(); today.setHours(0,0,0,0);
      const hasOverdue = tasks.some(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate); d.setHours(0,0,0,0);
        return d < today;
      });
      if (hasOverdue) openMorningTriage(); else markMorningTriageChecked();
    }
  }, [currentView, morningTriageDismissed, tasks.length, openMorningTriage, markMorningTriageChecked]);

  // Tauri window sizing (only in Tauri context)
  useEffect(() => {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return;
    const win = getCurrentWindow();
    if (burstModeActive) {
      win.setMinSize(null);
      win.setAlwaysOnTop(true);
      win.setDecorations(false);
      win.setSize(new LogicalSize(350, 600));
    } else {
      win.setAlwaysOnTop(false);
      win.setDecorations(true);
      win.setSize(new LogicalSize(1200, 800));
      win.setMinSize(new LogicalSize(900, 600));
    }
  }, [burstModeActive]);

  if (burstModeActive) return <BlitzWidget />;

  return (
    <>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      {/* Desktop layout: flex row, sidebar + main — no fixed positioning */}
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Sidebar: flex item, only visible on md+ */}
        <Sidebar />

        {/* Main area: fills remaining space */}
        <Dashboard />
      </div>

      {/* Overlays */}
      <QuickCapture />
      {/* Mobile: top brand bar + bottom tab nav (shown only on mobile via md:hidden) */}
      <MobileNav />
      <MorningTriage />
      <TaskDetailPane />
      <Toast />
      <SettingsModal />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
    </>
  );
}
