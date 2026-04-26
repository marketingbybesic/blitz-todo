# Blitz Code Review — Mistral Large CTO

Here's the brutal, specific review:

---

### BUGS
1. **store/useTaskStore.ts:35** — `loadTasks` function is incomplete (cut off at `const allTas`).
2. **App.tsx:38** — Shadow CSS variable is cut off (`shadow-[inset_0_0_15px_color-mix(in_srgb,var(--`).
3. **Dashboard.tsx:100** — `renderView()` switch statement is incomplete (cut off at `onClick={to`).
4. **TodayView.tsx:25** — Missing dependency `addTask` in `useEffect` or `useCallback` (if used in effects).
5. **TodayView.tsx:25** — No error handling for `loadTasks()` (async operation with no `.catch()`).

---

### MISSING_FEATURES
1. **Onboarding / Intro Sequence** — No implementation found (Framer Motion carousel).
2. **Global Quick-Capture (Cmd+Shift+Space)** — Tauri global shortcut not registered in code.
3. **Intelligence Split-Pane** — No LLM integration or structured task extraction.
4. **Focused vs. Planning Views** — Only "Today" view has basic filtering; no Kanban or multi-sort.
5. **Burst Mode Algorithm** — No prioritization logic for sub-15-minute tasks or Pomodoro timer.
6. **Gamification & Rule Engine** — No streaks, focus tracking, or deterministic rules.
7. **Morning Triage** — Only checks for overdue tasks; no triage UI/UX for task prioritization.
8. **Zod Validation** — Missing validation in `useTaskStore` for `addTask`/`updateTask` (e.g., `TaskSchema.parse()`).

---

### CSS_ISSUES
1. **Dashboard.tsx:25** — Hardcoded `bg-accent` (should use semantic `--accent` CSS var).
2. **Dashboard.tsx:26** — Hardcoded `text-white` (should use `text-on-accent` semantic var).
3. **Dashboard.tsx:27** — Hardcoded shadow color (`var(--accent)`) instead of semantic `--shadow-accent`.
4. **App.tsx:38** — Incomplete shadow variable (missing semantic `--shadow-inner`).
5. **No Theming System** — No `light`/`dark`/`midnight` theme switching or semantic vars defined in CSS.
6. **Spacing Violations** — `px-3 py-1` (Dashboard.tsx:24) uses 12px padding (violates 4/8/16px law).
7. **Glassmorphism Missing** — No `backdrop-blur-md` or borderless inputs in any component.

---

### TOP_5_FIXES
1. **Fix `loadTasks` in `useTaskStore`**
   - Complete the async function with proper error handling and Zod validation.
   - Example:
     ```ts
     loadTasks: async () => {
       try {
         const allTasks = await db.tasks.toArray();
         set({ tasks: allTasks.map(task => TaskSchema.parse(task)) });
       } catch (error) {
         console.error("Failed to load tasks:", error);
       }
     },
     ```

2. **Implement Zod Validation in `addTask`/`updateTask`**
   - Validate all inputs against `TaskSchema` before DB operations.
   - Example:
     ```ts
     addTask: async (task) => {
       const validatedTask = TaskSchema.omit({ id: true, createdAt: true }).parse(task);
       const id = await db.tasks.add({ ...validatedTask, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
       await get().loadTasks();
     },
     ```

3. **Replace Hardcoded Colors with Semantic Vars**
   - Define CSS vars in `index.css` (e.g., `--accent`, `--text-on-accent`, `--shadow-accent`).
   - Replace all instances like `bg-accent` with `bg-[var(--accent)]`.

4. **Fix Spacing Violations**
   - Replace `px-3 py-1` (12px) with `px-2 py-1` (8px/4px) or `px-4 py-2` (16px/8px).
   - Audit all spacing in `Dashboard.tsx` and `TodayView.tsx`.

5. **Implement Global Quick-Capture Shortcut**
   - Register Tauri global shortcut in `App.tsx`:
     ```ts
     import { register } from '@tauri-apps/api/globalShortcut';
     useEffect(() => {
       register('Cmd+Shift+Space', () => toggleCaptureModal());
       return () => unregister('Cmd+Shift+Space');
     }, []);
     ```

---
