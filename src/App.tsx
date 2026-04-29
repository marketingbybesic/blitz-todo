import { useState, useEffect } from 'react';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { useTaskStore }    from './store/useTaskStore';
import { useSettingsStore } from './store/useSettingsStore';
import { startClaudeCodeBridge } from './lib/claudeCodeIntegration';
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
  const [hasExitedBurst, setHasExitedBurst] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSidebarMode, setIsSidebarMode] = useState(window.innerWidth < 500);

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
  const toggleSidebar        = useTaskStore(s => s.toggleSidebar);
  const toggleSettingsModal  = useSettingsStore(s => s.toggleSettingsModal);

  // Boot data + initial sidebar collapse for compact viewports
  useEffect(() => {
    loadTasks();
    loadZones();
    checkAndUpdateStreak();
    startClaudeCodeBridge();
    // Auto-collapse sidebar on narrow screens at boot
    if (window.innerWidth < 1024 && useTaskStore.getState().isSidebarOpen) {
      toggleSidebar();
    }
  }, [loadTasks, loadZones, checkAndUpdateStreak, toggleSidebar]);

  // Responsive sidebar collapse on resize
  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setWindowWidth(w);
      setIsSidebarMode(w < 500);
      if (w < 1024 && useTaskStore.getState().isSidebarOpen) {
        toggleSidebar();
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [toggleSidebar]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); setIsCommandPaletteOpen(p => !p); }
      if (mod && e.shiftKey && e.key === ' ') { e.preventDefault(); toggleCaptureModal(); }
      if (mod && e.key.toLowerCase() === 'n') { e.preventDefault(); toggleCaptureModal(); }
      if (mod && e.key === ',') { e.preventDefault(); toggleSettingsModal(); }
      if (e.key === 'Escape' && isCommandPaletteOpen) { setIsCommandPaletteOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCaptureModal, toggleSettingsModal, isCommandPaletteOpen]);

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

  // Tauri window sizing + track burst mode exit
  useEffect(() => {
    if (!burstModeActive) {
      setHasExitedBurst(true);
    }
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
      win.setSize(new LogicalSize(1100, 800));
      win.setMinSize(new LogicalSize(320, 400));
    }
  }, [burstModeActive]);

  if (burstModeActive) return <BlitzWidget />;

  return (
    <>
      {showOnboarding && !hasExitedBurst && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      {/* Desktop layout: flex row, sidebar + main — no fixed positioning */}
      <div className={`flex h-screen w-screen overflow-hidden bg-background${isSidebarMode ? ' sidebar-mode' : ''}`}>
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
