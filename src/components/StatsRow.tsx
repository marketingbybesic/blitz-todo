import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { calculatePriority } from '../lib/priority';
import type { Task } from '../types';

export function StatsRow() {
  const [stats, setStats] = useState({
    totalCompletedToday: 0,
    deepWorkCompletedToday: 0,
    priorityScore: 0,
  });

  useEffect(() => {
    const updateStats = async () => {
      const allTasks = await db.tasks.toArray();
      const doneTasks = allTasks.filter((t) => t.status === 'done');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completedToday = doneTasks.filter((t) => {
        if (!t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
      });

      setStats({
        totalCompletedToday: completedToday.length,
        deepWorkCompletedToday: completedToday.filter(
          (t) => t.energyLevel === 'deep-work'
        ).length,
        priorityScore: doneTasks.reduce(
          (sum, t) => sum + calculatePriority(t),
          0
        ),
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-card/[0.02] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
          Completed Today
        </div>
        <div className="text-2xl font-bold text-accent">
          {stats.totalCompletedToday}
        </div>
      </div>
      <div className="bg-card/[0.02] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
          Deep Work Done
        </div>
        <div className="text-2xl font-bold text-accent">
          {stats.deepWorkCompletedToday}
        </div>
      </div>
      <div className="bg-card/[0.02] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
          Priority Score
        </div>
        <div className="text-2xl font-bold text-accent">
          {stats.priorityScore}
        </div>
      </div>
    </div>
  );
}
