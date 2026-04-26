import { useState, useEffect } from 'react';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { useTaskStore } from './store/useTaskStore';
import { useSettingsStore } from './store/useSettingsStore';
import { BlitzWidget } from './components/BlitzWidget';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { QuickCapture } from './components/QuickCapture';
import { MobileNav } from './components/MobileNav';
import { MorningTriage } from './components/MorningTriage';
import { TaskDetailPane } from './components/TaskDetailPane';
import { Toast } from './components/Toast';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { Onboarding } from './components/Onboarding';

export default function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('blitz-onboarded'));
  const burstModeActive = useTaskStore((state) => state.burstModeActive);
  const currentView = useTaskStore((state) => state.currentView);
  const tasks = useTaskStore((state) => state.tasks);
  const morningTriageDismissed = useTaskStore((state) => state.morningTriageDismissed);
  const openMorningTriage = useTaskStore((state) => state.openMorningTriage);
  const markMorningTriageChecked = useTaskStore((state) => state.markMorningTriageChecked);
  const toggleCaptureModal = useTaskStore((state) => state.toggleCaptureModal);
  const checkAndUpdateStreak = useSettingsStore((state) => state.checkAndUpdateStreak);

  useEffect(() => {
    checkAndUpdateStreak();
  }, [checkAndUpdateStreak]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === ' ') {
        e.preventDefault();
        toggleCaptureModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCaptureModal]);

  useEffect(() => {
    if (currentView === 'today' && !morningTriageDismissed) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const hasOverdue = tasks.some((t) => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        return dueDay < today;
      });
      if (hasOverdue) {
        openMorningTriage();
      } else {
        markMorningTriageChecked();
      }
    }
  }, [currentView, morningTriageDismissed, tasks.length, openMorningTriage, markMorningTriageChecked]);

  useEffect(() => {
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

  if (burstModeActive) {
    return <BlitzWidget />;
  }

  return (
    <>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      <div className="relative w-screen h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 shadow-[inset_0_0_15px_color-mix(in_srgb,var(--accent)_5%,transparent)] transition-shadow duration-1000" />
        <div className="relative z-10 h-screen flex">
          <Sidebar />
          <Dashboard />
        </div>
      </div>
      <QuickCapture />
      <MobileNav />
      <MorningTriage />
      <TaskDetailPane />
      <Toast />
      <SettingsModal />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
    </>
  );
}
