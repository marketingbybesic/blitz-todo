# 🧠 NEUROFLOW: V1 Master Architecture Document (MAD)

## 1. Core Philosophy & Tech Stack
* **Target:** A high-performance, native productivity engine for ADHD minds.
* **Framework:** Tauri v2 (Rust backend, web frontend) for Mac/Windows/Linux.
* **Frontend:** Vite, React, TypeScript, Tailwind CSS.
* **State Management:** Zustand (Modular slices, `persist` middleware).
* **Persistence:** Dexie.js (IndexedDB) for local-first, zero-latency data. NO cloud databases.
* **Validation:** Zod (Mandatory for AI outputs and form inputs).
* **Animations:** Framer Motion (Strictly for physics-based layout shifts and premium micro-interactions, no cheap CSS transitions).

## 2. Uncompromising Aesthetic Laws
* **Grid & Spacing:** Strict 4pt/8pt mathematical scale (`p-4`, `m-8`, `gap-6`).
* **Theming:** `light`, `dark`, and `midnight` (pure `#000000` for OLEDs).
* **Colors:** Exclusively use semantic CSS variables (`bg-background`, `text-foreground`, `bg-card`, `border-border`).
* **UI Paradigms:** Borderless inputs, sleek glassmorphism (`backdrop-blur-md`), minimal visual clutter.

## 3. Core Engine Features
1. **Onboarding / Intro Sequence:** A sleek, Framer Motion-powered introductory carousel explaining features and setting up user preferences.
2. **Global Quick-Capture:** A global OS shortcut (Cmd+Shift+Space) to instantly capture tasks without breaking focus.
3. **Intelligence Split-Pane:** Raw notes on the left -> LLM structured tasks/highlights on the right.
4. **Focused vs. Planning Views:**
   * *Planning View:* Multi-sort capability (Priority, Date), Kanban, and List views for deep organization.
   * *Focused View:* A distraction-free execution environment showing only the current project or day.
5. **Burst Mode:** An algorithmic queue that prioritizes sub-15-minute tasks to generate dopamine momentum before tackling larger "MITs" (Most Important Tasks). Includes a visual Pomodoro timer.
6. **Gamification & Rule Engine:** Deterministic tracking of Daily Streaks and Focus Points, plus auto-tagging rules (e.g., If "buy" -> tag "Errands").

## 4. Development Strategy & Rules of Engagement
* **Rule 1: The Foundation is Serial.** `types.ts`, `Dexie` schemas, and `Zustand` stores must be built one by one.
* **Rule 2: Component Isolation.** Complex UI views must be broken into isolated React components to allow for parallel development once state is locked.
* **Rule 3: The Diff Protocol.** AI agents must NEVER rewrite entire files unless explicitly instructed. Use `// ... existing code ...` to preserve tokens and prevent hallucinated truncation.