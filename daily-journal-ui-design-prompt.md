# Daily Journal App — UI/UX Layout & Dashboard Design Prompt (for your AI Agent)

> Paste this entire document into your agent's prompt along with your existing SRS.
> Stack: **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui**

---

## 1. Role & Goal

You are a senior product designer and front-end engineer. Build the UI shell and dashboard for a **daily journal app** using Next.js App Router and shadcn/ui. Follow modern 2025–2026 dashboard conventions: minimal chrome, generous whitespace, soft neutral palettes with one accent color, fluid typography, and subtle micro-interactions. Prioritize **calm, focused writing** — the UI should feel like paper, not a cockpit.

---

## 2. Global Layout Architecture

Use a **three-zone app shell**, consistent across all authenticated pages:

```
┌──────────────────────────────────────────────────────┐
│  HEADER (sticky, 56–64px, blur backdrop)             │
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ SIDEBAR  │              MAIN CONTENT                 │
│ (collap- │        (max-w readable column             │
│ sible)   │         ~640–720px centered OR            │
│ 240px /  │         full-width dashboard grid)        │
│  64px    │                                           │
└──────────┴───────────────────────────────────────────┘
```

### Rules
- App shell lives in `app/(app)/layout.tsx` (sidebar + header) so all inner routes inherit it.
- Main content area: `p-6 lg:p-8`, with `container` max-width per page type:
  - **Writing/editor pages**: narrow, centered `max-w-2xl` (72–80 chars per line for readability).
  - **Dashboard/analytics**: `max-w-7xl` with a responsive 12-col grid (`grid-cols-1 md:grid-cols-6 lg:grid-cols-12`).
- Sidebar: collapsible (`collapsed` state persisted in `localStorage`), animated with CSS transitions. On mobile, it becomes a Sheet (shadcn `Sheet` component, slide-in from left).

---

## 3. Sidebar — Specification

**Structure (top → bottom):**

1. **Brand block** — app logo mark + wordmark. When collapsed, show icon only.
2. **Primary "New Entry" button** — full-width in expanded state, icon-only in collapsed state. Use the accent color. This is the #1 CTA.
3. **Nav sections** with shadcn `Separator` between them:
   - **Main**: Today, Timeline, Calendar, Collections/Tags, Search
   - **Insights** (secondary): Streaks, Mood Trends, Word Cloud
   - **Library**: All Entries, Favorites, Archive, Trash
4. **Tag cloud / quick filters** — small pills at the bottom of the nav (scrollable), muted style.
5. **Bottom user block** — avatar + name + settings/logout via `DropdownMenu`. When collapsed, avatar only.

**Interaction & style:**
- Use shadcn `Sidebar` component patterns (or build with `ScrollArea` + custom nav).
- Active route: accent-tinted background (`bg-accent/50`) + accent text + 2px left indicator bar, rounded `rounded-md`.
- Icons: `lucide-react` only. Labels `text-sm font-medium`.
- Hover: subtle `bg-muted` transition, `150ms ease`.
- Keyboard shortcut hints on the right of labels (e.g. `⌘K` for search) using `<kbd>` styling.

---

## 4. Header — Specification

Keep the header **thin and quiet** — it supports, never competes.

**Left:**
- Mobile: hamburger (opens sidebar Sheet).
- Desktop: **breadcrumbs** (`Breadcrumb` from shadcn) showing page context.

**Center:**
- **Global Command Palette trigger** (shadcn `Command` in a `Dialog`). Pill-shaped input, placeholder "Search entries, tags, moods… ⌘K". This is the primary navigation mechanism — make it prominent.

**Right (actions cluster):**
- Streak indicator (flame icon + count, `Tooltip` on hover).
- Theme toggle (Sun/Moon, `DropdownMenu` with Light/Dark/System).
- Notifications bell (`Popover` with recent reminders — optional per SRS).
- User avatar `DropdownMenu` (Profile, Settings, Sign out).

**Style:**
- Height `h-14`, `backdrop-blur-md bg-background/80 border-b`, `supports-[backdrop-filter]` pattern from shadcn.
- No page title text in header — breadcrumbs handle it.

---

## 5. Dashboard (Home) Content Layout

The dashboard answers three questions at a glance: **How am I doing? Did I write today? What did I write?**

### Section order (top → bottom):

1. **Daily greeting strip** — "Good evening, {name}." + today's date + current streak chip. `text-2xl font-semibold tracking-tight`.
2. **"Write today" hero card** — large, inviting card with a soft gradient or paper-texture background, one-line prompt of the day (e.g., "What's one thing that made you smile today?"), and a big "Start writing" button. If an entry exists today → show excerpt + "Continue writing".
3. **Stats row (bento mini-grid)** — 4 `Card`s: Current streak, Entries this month, Avg. mood, Total words. Numbers `text-2xl font-bold`, muted labels `text-xs uppercase tracking-wide`. Grid: `grid-cols-2 lg:grid-cols-4`, gap 4.
4. **Two-column insight area** (12-col grid):
   - Left (span 8): **Mood/activity chart card** — area or bar chart (use `recharts`) of last 30 days. Card header with title + `Select` for time range (7d / 30d / 90d).
   - Right (span 4): **Recent entries list** — last 5 entries: title, date, mood emoji, tag pills. Each row links to the entry.
5. **Tag/word cloud card** — horizontal scroll of tag pills sized by frequency (subtle).
6. **Calendar heatmap strip** (optional, if in SRS) — GitHub-style contribution grid, last ~16 weeks, accent color scale.

### Card style (global `Card` recipe)
- `rounded-xl border bg-card shadow-sm`, hover: `shadow-md transition-shadow`.
- Header: `flex items-center justify-between pb-2`, title `text-sm font-medium`.
- Consistent internal padding `p-5` / `p-6`.

---

## 6. Visual System (shadcn Tokens)

Configure in `globals.css` + `tailwind.config` via shadcn theme. Use **OKLCH** colors (shadcn default).

| Token | Recommendation |
|---|---|
| `--background` / `--foreground` | Warm off-white `#FAFAF8` / near-black `#1A1A1A` (paper feel). Dark: `#121212` / `#EDEDED` |
| `--primary` (accent) | One hue only — e.g., soft indigo `oklch(0.55 0.18 280)` or warm terracotta. Journal apps suit warm/earthy or calm cool tones. Never use a rainbow. |
| `--muted` / `--muted-foreground` | Neutral gray scale, `muted-foreground` at 60–65% contrast |
| `--accent` | Very light tint of primary for active states |
| `--card` / `--popover` | Slightly different from background for subtle elevation |
| `--border` | `oklch` low-chroma neutral, hairline (`1px`) |
| `--radius` | `0.75rem` (rounded, friendly) |

**Typography:**
- Font: **Inter** or **Geist** (body) + optional serif (e.g., **Newsreader** or **Lora**) for entry *reading* view to feel book-like. UI stays sans-serif.
- Scale (fluid, `clamp`): base 16px, headings `tracking-tight`, body `leading-relaxed` (1.65) for reading pages.
- Load via `next/font` with `variable` + `display: swap`.

**Dark mode:** full support via `next-themes`, `class` strategy. Never hardcode colors — always tokens (`bg-background`, `text-muted-foreground`, etc.).

---

## 7. Component & Interaction Best Practices

- **Every interactive element** comes from shadcn/ui primitives: `Button`, `Card`, `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tooltip`, `Command`, `Calendar`, `Select`, `Badge`, `Separator`, `Skeleton`, `Sonner` (toasts).
- **Loading states:** `Skeleton` matching the exact layout of each section; never a bare spinner.
- **Empty states:** friendly illustration/icon + one sentence + one CTA button (e.g., "No entries yet — write your first one").
- **Micro-interactions:** `transition-all duration-200`, hover lift on cards (`-translate-y-0.5`), button press scale `[0.98]`. Respect `prefers-reduced-motion`.
- **Keyboard shortcuts:** `⌘K` command palette, `N` new entry, `/` focus search. Show hints in tooltips. Use a `useHotkeys` hook or `tinykeys`.
- **Accessibility:** WCAG AA — visible focus rings (`focus-visible:ring-2 ring-primary/40`), aria labels on icon buttons, `Dialog` focus trapping, semantic landmarks (`<header>`, `<nav>`, `<main>`), min touch target 40px.
- **Responsive breakpoints:** `sm` 640, `md` 768, `lg` 1024, `xl` 1280. Sidebar hidden below `lg` (Sheet instead). Stats stack 2-col on mobile.

---

## 8. Page-Level Layout Templates

- **Editor page** (`/today`, `/entry/[id]`): distraction-free mode — hide sidebar option, centered `max-w-2xl`, autosave indicator ("Saving… / Saved ✓") top-right, mood selector + tags below title, minimal toolbar (bold, italic, list) that appears on selection.
- **Timeline** (`/timeline`): vertical timeline with month dividers, entry cards with date rail on the left.
- **Calendar** (`/calendar`): shadcn `Calendar` large + side panel showing selected day's entry preview.
- **Settings** (`/settings`): shadcn `Tabs` (Profile, Appearance, Notifications, Data) in a centered `max-w-3xl` column with sticky left sub-nav on desktop.

---

## 9. Technical Implementation Notes

- Next.js **App Router** with **Server Components by default**; interactivity islands (`"use client"`) only where needed (sidebar state, command palette, charts).
- Data fetching: Server Components + your ORM (e.g., Prisma/Drizzle) directly, or Route Handlers; show `Skeleton` via `loading.tsx` per route segment.
- Charts: `recharts` (client components) wrapped in a `Suspense` boundary.
- Theme: `next-themes` provider in root layout.
- Streak heatmap: lightweight custom grid or `react-activity-calendar` styled with tokens.
- Keep all UI strings in one `constants/labels.ts` for future i18n.

---

## 10. Definition of Done (for the UI shell)

- [ ] App shell (sidebar + header) on `(app)/layout.tsx`, collapsible & persisted
- [ ] Command palette with ⌘K, searching entries & tags
- [ ] Dashboard with greeting, hero write card, 4 stat cards, mood chart, recent entries
- [ ] Dark mode toggle with system default, fully token-driven colors
- [ ] All shadcn components themed, OKLCH tokens set, fluid type scale
- [ ] Loading skeletons, empty states, error boundaries per section
- [ ] Responsive: sidebar→Sheet under `lg`, grids collapse correctly
- [ ] A11y pass: focus rings, aria labels, landmarks, AA contrast

---

*End of prompt. Combine with your SRS requirements and let the agent scaffold the routes, then iterate section by section.*
