// Simple iCal parser for .ics files
export interface CalEvent {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  allDay: boolean;
}

export function parseICal(icsText: string): CalEvent[] {
  const events: CalEvent[] = [];
  const lines = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Unfold long lines
  const unfolded = lines.replace(/\n[ \t]/g, '');
  const blocks = unfolded.split('BEGIN:VEVENT');

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    const get = (key: string): string => {
      const re = new RegExp(`^${key}[^:]*:(.*)$`, 'im');
      return (block.match(re)?.[1] ?? '').trim();
    };

    const uid   = get('UID');
    const title = get('SUMMARY').replace(/\\,/g, ',').replace(/\\n/g, ' ');
    const dtstart = get('DTSTART');
    const dtend   = get('DTEND');
    const desc    = get('DESCRIPTION').replace(/\\n/g, '\n').replace(/\\,/g, ',');
    const loc     = get('LOCATION').replace(/\\,/g, ',');

    if (!dtstart || !title) continue;

    const parseDate = (dt: string): Date => {
      // All-day: YYYYMMDD, datetime: YYYYMMDDTHHMMSSZ or with ;TZID=...
      const clean = dt.replace(/^[^:]+:/, '').trim();
      if (clean.length === 8) {
        return new Date(`${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}`);
      }
      const y = clean.slice(0,4), mo = clean.slice(4,6), d = clean.slice(6,8);
      const h = clean.slice(9,11), mi = clean.slice(11,13), s = clean.slice(13,15);
      const utc = clean.endsWith('Z');
      return utc
        ? new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`)
        : new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
    };

    try {
      events.push({
        uid: uid || crypto.randomUUID(),
        title,
        start: parseDate(dtstart),
        end: dtend ? parseDate(dtend) : parseDate(dtstart),
        description: desc || undefined,
        location: loc || undefined,
        allDay: dtstart.includes(';VALUE=DATE') || (!dtstart.includes('T') && dtstart.length <= 8),
      });
    } catch { /* skip malformed */ }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}
