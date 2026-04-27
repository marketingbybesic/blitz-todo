import type { CalEvent } from './ical';

const KEY = 'blitz-calendar-events';

export function getCalendarEvents(): CalEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const stored = JSON.parse(raw) as Array<CalEvent & { start: string; end: string }>;
    return stored.map(e => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));
  } catch { return []; }
}

export function saveCalendarEvents(events: CalEvent[]): void {
  localStorage.setItem(KEY, JSON.stringify(events));
}

export function clearCalendarEvents(): void {
  localStorage.removeItem(KEY);
}
