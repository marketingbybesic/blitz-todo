// src/lib/ai.ts
// Universal AI service — BYOK (Bring Your Own Key)
// Reads API keys from localStorage (blitz-ai-settings)
// Falls back to Gemini key if user has no key configured

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;  // user's key
  model: string;   // e.g. gpt-4o-mini, claude-3-haiku-20240307, gemini-2.0-flash
  enabled: boolean;
}

const FALLBACK_GEMINI_KEY = 'AIzaSyDPW0tks9GLHaT4Tk4NJBofUqz1qH8NgpE';

export function getAISettings(): AISettings | null {
  try {
    const raw = localStorage.getItem('blitz-ai-settings');
    if (raw) {
      const parsed = JSON.parse(raw) as AISettings;
      if (parsed.apiKey && parsed.enabled) return parsed;
    }
  } catch {}
  // Fallback to built-in Gemini
  return {
    provider: 'gemini',
    apiKey: FALLBACK_GEMINI_KEY,
    model: 'gemini-2.0-flash',
    enabled: true,
  };
}

export function isUserAIEnabled(): boolean {
  try {
    const raw = localStorage.getItem('blitz-ai-settings');
    if (raw) {
      const parsed = JSON.parse(raw) as AISettings;
      return !!(parsed.apiKey && parsed.enabled);
    }
  } catch {}
  return false; // fallback mode, not user-enabled
}

export async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  const settings = getAISettings();
  if (!settings) throw new Error('No AI configured');

  if (settings.provider === 'gemini') {
    return callGemini(prompt, settings.apiKey, settings.model, systemPrompt);
  } else if (settings.provider === 'openai') {
    return callOpenAI(prompt, settings.apiKey, settings.model, systemPrompt);
  } else if (settings.provider === 'anthropic') {
    return callAnthropic(prompt, settings.apiKey, settings.model, systemPrompt);
  }
  throw new Error('Unknown provider');
}

async function callGemini(prompt: string, key: string, model: string, systemPrompt?: string): Promise<string> {
  const contents = systemPrompt
    ? [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] }]
    : [{ parts: [{ text: prompt }] }];
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 1024 } }) }
  );
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message || `Gemini error ${r.status}`);
  }
  const d = await r.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callOpenAI(prompt: string, key: string, model: string, systemPrompt?: string): Promise<string> {
  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: 1024 }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message || `OpenAI error ${r.status}`);
  }
  const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
  return d.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(prompt: string, key: string, model: string, systemPrompt?: string): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  };
  if (systemPrompt) body.system = systemPrompt;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message || `Anthropic error ${r.status}`);
  }
  const d = await r.json() as { content?: Array<{ text?: string }> };
  return d.content?.[0]?.text ?? '';
}

// NLP date/priority/tag parser
export interface ParsedTask {
  title: string;
  dueDate?: string; // ISO date string
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  energyLevel?: 'deep-work' | 'light-work';
  estimatedMinutes?: number;
}

export async function parseNaturalLanguageTask(input: string): Promise<ParsedTask> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Try local parsing first (fast, no API needed)
  const local = tryLocalParse(input, today, tomorrowStr, todayStr);
  if (local) return local;

  // AI parsing
  const prompt = `Parse this task description and extract structured data. Today is ${todayStr}.

Input: "${input}"

Return ONLY valid JSON with these fields (omit fields that are not present):
{
  "title": "clean task title without dates/tags/priority markers",
  "dueDate": "YYYY-MM-DD or null",
  "priority": "high|medium|low or null",
  "tags": ["tag1", "tag2"] or [],
  "energyLevel": "deep-work|light-work or null",
  "estimatedMinutes": number or null
}

Rules:
- "tomorrow" = ${tomorrowStr}, "today" = ${todayStr}
- "Friday" = next Friday from today
- "!high" or "urgent" or "asap" = high priority
- "!low" or "someday" = low priority
- "#tag" = tag
- "meeting", "call", "review" → light-work; "write", "code", "design", "research" → deep-work
- Never include dates/tags/priority markers in title`;

  const resp = await callAI(prompt);
  const match = resp.match(/\{[\s\S]*\}/);
  if (!match) return { title: input };
  try {
    const parsed = JSON.parse(match[0]) as {
      title?: string;
      dueDate?: string | null;
      priority?: 'high' | 'medium' | 'low' | null;
      tags?: string[];
      energyLevel?: 'deep-work' | 'light-work' | null;
      estimatedMinutes?: number | null;
    };
    return {
      title: parsed.title || input,
      dueDate: parsed.dueDate || undefined,
      priority: parsed.priority || undefined,
      tags: parsed.tags || undefined,
      energyLevel: parsed.energyLevel || undefined,
      estimatedMinutes: parsed.estimatedMinutes || undefined,
    };
  } catch {
    return { title: input };
  }
}

function tryLocalParse(input: string, today: Date, tomorrowStr: string, todayStr: string): ParsedTask | null {
  let title = input;
  const result: ParsedTask = { title: input };
  let matched = false;

  // Priority markers
  if (/!high|!!|urgent|asap/i.test(title)) { result.priority = 'high'; title = title.replace(/!high|!!|urgent|asap/gi, '').trim(); matched = true; }
  else if (/!low|someday/i.test(title)) { result.priority = 'low'; title = title.replace(/!low|someday/gi, '').trim(); matched = true; }
  else if (/!med|!medium/i.test(title)) { result.priority = 'medium'; title = title.replace(/!med|!medium/gi, '').trim(); matched = true; }

  // Tags
  const tags = [...title.matchAll(/#([\w-]+)/g)].map(m => m[1]);
  if (tags.length > 0) { result.tags = tags; title = title.replace(/#[\w-]+/g, '').trim(); matched = true; }

  // Dates
  if (/\btoday\b/i.test(title)) { result.dueDate = todayStr; title = title.replace(/\btoday\b/gi, '').trim(); matched = true; }
  else if (/\btomorrow\b/i.test(title)) { result.dueDate = tomorrowStr; title = title.replace(/\btomorrow\b/gi, '').trim(); matched = true; }
  else if (/\bmonday\b/i.test(title)) { result.dueDate = getNextWeekday(today, 1); title = title.replace(/\bmonday\b/gi, '').trim(); matched = true; }
  else if (/\btuesday\b/i.test(title)) { result.dueDate = getNextWeekday(today, 2); title = title.replace(/\btuesday\b/gi, '').trim(); matched = true; }
  else if (/\bwednesday\b/i.test(title)) { result.dueDate = getNextWeekday(today, 3); title = title.replace(/\bwednesday\b/gi, '').trim(); matched = true; }
  else if (/\bthursday\b/i.test(title)) { result.dueDate = getNextWeekday(today, 4); title = title.replace(/\bthursday\b/gi, '').trim(); matched = true; }
  else if (/\bfriday\b/i.test(title)) { result.dueDate = getNextWeekday(today, 5); title = title.replace(/\bfriday\b/gi, '').trim(); matched = true; }

  // Time estimates like "30min", "2h", "1 hour"
  const timeMatch = title.match(/(\d+)\s*(min|mins|minutes|h|hr|hour|hours)/i);
  if (timeMatch) {
    const num = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    result.estimatedMinutes = unit.startsWith('h') ? num * 60 : num;
    title = title.replace(timeMatch[0], '').trim();
    matched = true;
  }

  // Clean up double spaces
  title = title.replace(/\s+/g, ' ').trim();
  result.title = title;

  return matched ? result : null;
}

function getNextWeekday(from: Date, dayOfWeek: number): string {
  const d = new Date(from);
  const diff = (dayOfWeek + 7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
