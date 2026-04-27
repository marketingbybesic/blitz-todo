# ⚡ Blitz — ADHD Productivity Engine

**The productivity app built for ADHD brains. No bloat. Pure focus.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Build](https://github.com/marketingbybesic/blitz-todo/actions/workflows/build-check.yml/badge.svg)](https://github.com/marketingbybesic/blitz-todo/actions)

---

Blitz is a local-first, cross-platform desktop productivity app designed from the ground up for ADHD brains. No subscriptions. No cloud lock-in. No overwhelming UX. Just a fast, focused tool that works the way your brain does.

## Features

- ⚡ **Today View** — See only what matters right now. One focused list, zero noise.
- 🕐 **Timeline** — Visual time-blocking so hours feel real, not abstract.
- 📋 **Projects & Kanban** — Capture the big picture without losing the details.
- 🔥 **Burst Mode** — Timed hyperfocus sessions. Get in, get it done, get out.
- 🧠 **Brain Dump with AI** — Unload your head instantly. AI helps sort the chaos into actionable tasks.
- 🟣 **Zones** — Context-switch between Life, Work, and Side Projects without losing your place.
- 🧙 **Scheduling Wizard** — Tells you what to work on next based on energy, deadlines, and context.

## Screenshots

[Screenshot coming soon]

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Tauri v2](https://tauri.app) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Local DB | Dexie (IndexedDB) |
| Animations | Framer Motion |
| Rich Text | TipTap |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 18
- [Rust](https://rustup.rs) (stable toolchain)
- Platform build dependencies — see [Tauri prerequisites](https://tauri.app/start/prerequisites/)

### Development

```bash
git clone https://github.com/marketingbybesic/blitz-todo.git
cd blitz-todo
npm install
npm run tauri dev
```

The app will launch in a native window. The frontend hot-reloads on save; Rust changes require a Cargo rebuild.

## Building for Production

```bash
npm run tauri build
```

Build artifacts are output to `src-tauri/target/release/bundle/`:

| Platform | Artifact | Location |
|----------|----------|----------|
| macOS | `.dmg` | `bundle/dmg/` |
| Windows | `.msi` / `.exe` | `bundle/msi/` or `bundle/nsis/` |
| Linux | `.AppImage` | `bundle/appimage/` |
| Linux | `.deb` | `bundle/deb/` |

### Cross-platform CI builds

Releases are built automatically via GitHub Actions on every `v*` tag push. See `.github/workflows/release.yml`.

## Distribution

| Platform | Format | Notes |
|----------|--------|-------|
| macOS (Apple Silicon) | `.dmg` | arm64, macOS 10.15+ |
| macOS (Intel) | `.dmg` | x86_64, macOS 10.15+ |
| Windows | `.msi` + `.exe` | x86_64, Windows 10+ |
| Linux | `.AppImage` | x86_64, portable |
| Linux | `.deb` | x86_64, Debian/Ubuntu |

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

Use the issue templates in `.github/ISSUE_TEMPLATE/` for bugs and feature requests.

## Design Philosophy

Blitz is built around four principles:

1. **ADHD-first** — Every design decision is evaluated through the lens of executive dysfunction, time blindness, and working memory limits. If it adds friction, it doesn't ship.
2. **OLED neon Apple aesthetic** — Dark, high-contrast UI with neon accents. Fast to scan, easy on the eyes in a dark room.
3. **Local-first** — Your data lives on your device. No accounts required, no internet dependency, no privacy trade-offs.
4. **Open source** — Transparent, auditable, and community-driven. ADHD is a spectrum; the community shapes what Blitz becomes.

## License

MIT — see [LICENSE](LICENSE) for details.
