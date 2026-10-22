# Routinely

A joyful, React + TypeScript web app that turns recurring daily tasks into a playful game. Add habits, mark them complete, and collect points with lively animations and streak tracking.

## Getting Started

```bash
npm install
npm run dev
```

Open the printed URL (defaults to `http://localhost:5173`) and start adding habits. Each completion grants points and keeps your streak blazing. Build for production with `npm run build` and preview via `npm run preview`.

## Core Experience

- **Zero-onboarding interactions** - add a habit and tap "Complete" to instantly see celebratory feedback.
- **Daily streak awareness** - streaks grow with consecutive days and power up point rewards.
- **Gamified encouragement** - a points dashboard, progress bar, and confetti burst keep momentum high.

Local state persists in `localStorage`, so you can close the tab and keep progressing the next day. Reset progress by clearing browser storage.

## Node.js version

Use Node.js 24.22.1 or a newer 24.x patch release. Run `nvm install && nvm use`
to select the patched version in `.nvmrc`. The minimum includes the October 21, 2026
[Node.js security fixes](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
