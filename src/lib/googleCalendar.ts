// src/lib/googleCalendar.ts
// Google Calendar integration — OAuth 2.0 flow via Tauri browser open
// Uses a local loopback redirect (localhost:7832/oauth/callback)

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  allDay: boolean;
  color?: string;
  calendarName?: string;
}

export interface GoogleCalendarConfig {
  clientId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  email?: string;
  syncEnabled: boolean;
}

const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const REDIRECT_URI = 'http://localhost:7832/oauth/callback';
const STORAGE_KEY = 'blitz-gcal-config';

export function getGCalConfig(): GoogleCalendarConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GoogleCalendarConfig;
  } catch {
    return null;
  }
}

export function saveGCalConfig(config: GoogleCalendarConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearGCalConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildAuthUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'token', // Implicit flow (no client secret needed for SPA)
    scope: GOOGLE_SCOPES,
    include_granted_scopes: 'true',
    state: Math.random().toString(36).slice(2),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function openGoogleAuthWindow(clientId: string): Promise<string | null> {
  const authUrl = buildAuthUrl(clientId);

  // Try Tauri shell open first (desktop)
  try {
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(authUrl);
  } catch {
    // Fallback: open in new window (web mode)
    window.open(authUrl, '_blank', 'width=500,height=600');
  }

  // Return the auth URL for the user to complete manually if needed
  return authUrl;
}

interface GCalListItem {
  selected?: boolean;
  accessRole?: string;
  id: string;
  summary: string;
  backgroundColor?: string;
}

interface GCalEventItem {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export async function fetchCalendarEvents(
  accessToken: string,
  daysAhead: number = 30
): Promise<CalendarEvent[]> {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + daysAhead * 86400000).toISOString();

  try {
    // First get list of calendars
    const calListResp = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!calListResp.ok) throw new Error(`Calendar list failed: ${calListResp.status}`);
    const calList = await calListResp.json() as { items?: GCalListItem[] };
    const calendars = (calList.items ?? []).filter(
      (c) => c.selected && c.accessRole !== 'none'
    );

    // Fetch events from each calendar in parallel
    const allEvents: CalendarEvent[] = [];
    await Promise.all(
      calendars.slice(0, 5).map(async (cal) => {
        try {
          const eventsResp = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?` +
              `timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!eventsResp.ok) return;
          const data = await eventsResp.json() as { items?: GCalEventItem[] };
          const events: CalendarEvent[] = (data.items ?? []).map((e) => ({
            id: e.id,
            title: e.summary ?? '(No title)',
            start: e.start?.dateTime ?? e.start?.date ?? '',
            end: e.end?.dateTime ?? e.end?.date ?? '',
            allDay: !e.start?.dateTime,
            color: cal.backgroundColor,
            calendarName: cal.summary,
          }));
          allEvents.push(...events);
        } catch {
          // skip failed calendar
        }
      })
    );

    return allEvents.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  } catch (e) {
    console.error('Google Calendar fetch error:', e);
    throw e;
  }
}

export async function refreshGoogleCalendar(
  config: GoogleCalendarConfig
): Promise<CalendarEvent[]> {
  if (!config.accessToken) throw new Error('No access token');

  // Check if token is expired (implicit tokens expire in 1 hour)
  if (config.expiresAt && Date.now() > config.expiresAt - 60000) {
    throw new Error('Token expired — please reconnect Google Calendar');
  }

  return fetchCalendarEvents(config.accessToken);
}
