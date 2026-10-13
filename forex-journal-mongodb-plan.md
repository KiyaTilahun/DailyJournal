# Forex Trading Journal — MongoDB Database Configuration Plan
### Migration plan: static files → MongoDB (Vercel-deployable)

> Context: Next.js App Router app, currently using static JSON/files, deploying to **Vercel**. Database: **MongoDB Atlas**. ODM: **Mongoose** (recommended) or native driver (alternative noted below).
> The journal is personal/single-user, so no auth schema is required — keep it lean.

---

## 1. Architecture Overview

```
┌──────────────┐      HTTPS/Server Actions      ┌──────────────────────┐
│   Vercel     │  ────────────────────────────▶ │   MongoDB Atlas      │
│  (Next.js)   │      MONGODB_URI (env var)     │  (free M0 cluster    │
└──────────────┘                                │   is fine to start)  │
                                                └──────────────────────┘
        │
        ├──▶ Vercel Blob / Cloudinary ── chart screenshots (images, NOT in Mongo)
        └──▶ /api/export/csv ── backups to CSV (keep from SRS §5.1)
```

**Key decisions:**
| Decision | Choice | Why |
|---|---|---|
| Database | MongoDB Atlas (M0 free tier → M10 later if needed) | Native JSON-like docs match your trade shape; zero-downtime, Vercel-friendly |
| ODM | **Mongoose** | Schema validation + enums for sessions/mistakes/emotions; less boilerplate |
| Images | **Vercel Blob** (or Cloudinary) | Serverless-friendly; MongoDB is a bad fit for binary images; SRS requires screenshot uploads |
| Secrets | Vercel Environment Variables | `MONGODB_URI` never in code |
| Backups | CSV export route + `mongodump` locally | SRS §5.1 exportability requirement |

---

## 2. Step 1 — MongoDB Atlas Setup

1. Create a free account at cloud.mongodb.com → **Build a Database** → **M0 FREE**.
2. Create a database user (username/password) — save credentials.
3. Network Access → **Allow Access from Anywhere** (`0.0.0.0/0`) — required for Vercel serverless IPs (they rotate).
4. Databases → **Connect** → Drivers → Node.js → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/trading-journal?retryWrites=true&w=majority
   ```
5. In Vercel Dashboard → your project → **Settings → Environment Variables**:
   - `MONGODB_URI` = the string above (set for Production + Preview + Development)

---

## 3. Step 2 — Project Dependencies

```bash
npm install mongoose
npm install @vercel/blob        # for chart screenshots
npm install zod                 # shared validation (server + client forms)
```

---

## 4. Step 3 — Folder Structure

```
lib/
├── db.ts                 # cached connection singleton (CRITICAL for serverless)
├── models/
│   ├── Trade.ts          # main trade document
│   └── Strategy.ts       # user-defined strategies (dropdown source)
├── validations/
│   └── trade.ts          # Zod schema (mirrors mongoose schema)
└── utils.ts
app/
├── api/
│   ├── trades/
│   │   ├── route.ts          # GET list (with filters) / POST create
│   │   └── [id]/route.ts     # GET / PATCH / DELETE one
│   ├── strategies/route.ts   # GET / POST strategy list
│   └── export/csv/route.ts   # GET → CSV download (SRS §5.1)
scripts/
└── migrate-static.ts     # one-time import from your static JSON files
```

---

## 5. Step 4 — The Connection Singleton (`lib/db.ts`)

Vercel serverless functions are stateless and can reuse warm instances — without caching, you'll exhaust Atlas connections (classic `MongooseServerSelectionError` / max-pool issues).

```ts
// lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined");

let cached = (global as any).mongoose;
if (!cached) cached = (global as any).mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,          // keep low for serverless
      serverSelectionTimeoutMS: 5000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

---

## 6. Step 5 — Schemas (the heart of the plan)

### 6.1 `Strategy` — small reference collection
Keeps the "Strategy Used" dropdown (SRS §2.2) editable without code changes.

```ts
// lib/models/Strategy.ts
import { Schema, model, models } from "mongoose";

const strategySchema = new Schema({
  name:        { type: String, required: true, unique: true },  // "Breakout", "SMC", ...
  description: { type: String, default: "" },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

export const Strategy = models.Strategy || model("Strategy", strategySchema);
```

### 6.2 `Trade` — one document per trade
Maps 1:1 onto SRS sections 2, 3. Flat structure inside one doc = one fast read for dashboard analytics.

```ts
// lib/models/Trade.ts
import { Schema, model, models } from "mongoose";

const tradeSchema = new Schema({
  // ── §2.1 Execution (quantitative) ─────────────────────────
  instrument:   { type: String, required: true, uppercase: true, trim: true }, // "EURUSD"
  direction:    { type: String, enum: ["LONG", "SHORT"], required: true },
  entryTime:    { type: Date, required: true },
  exitTime:     { type: Date },
  entryPrice:   { type: Number, required: true },
  stopLoss:     { type: Number },
  takeProfit:   { type: Number },
  exitPrice:    { type: Number },
  lotSize:      { type: Number },
  riskPercent:  { type: Number },
  commission:   { type: Number, default: 0 },
  swap:         { type: Number, default: 0 },
  spread:       { type: Number, default: 0 },
  grossPnL:     { type: Number, default: 0 },
  netPnL:       { type: Number, required: true },

  // ── §2.2 Setup & Strategy (qualitative) ───────────────────
  strategy:     { type: Schema.Types.ObjectId, ref: "Strategy", required: true },
  executionTF:  { type: String },                  // "5m", "15m"
  trendTF:      { type: String },                  // "4H", "D"
  confluences:  [{ type: String }],                // checkbox list, free-form tags
  plannedRR:    { type: Number },                  // 2.5  (planned R:R)
  realizedRR:   { type: Number },                  // computed or entered
  session:      { type: String, enum: ["ASIAN", "LONDON", "NEW_YORK", "OVERLAP"] },

  // ── §3 Psychology & Media ─────────────────────────────────
  preTradeEmotion:  { type: String, enum: ["CONFIDENT","CALM","NEUTRAL","ANXIOUS","FOMO","REVENGE"] },
  emotionScore:     { type: Number, min: 1, max: 5 },
  postTradeEmotion: { type: String, enum: ["HELD_TO_TP","CLOSED_EARLY","MOVED_SL_BE","PANIC_CLOSED","OVERSIZED_WIN"] },
  mistakes:     [{ type: String }],                // "OVER_LEVERAGED","IGNORED_NEWS","CHASED_PRICE"
  lessons:      { type: String, default: "" },

  // Screenshots: store BLOB URLS, not binary (see §9)
  screenshots:  [{
    label: { type: String, enum: ["ENTRY_TF", "HTF_CONTEXT"] },
    url:   { type: String }
  }],

  // ── meta ──────────────────────────────────────────────────
  tags:         [{ type: String }],
}, { timestamps: true });

// Indexes that power the SRS §4 analytics queries
tradeSchema.index({ exitTime: -1 });                       // equity curve sort
tradeSchema.index({ instrument: 1, exitTime: -1 });        // best/worst pairs
tradeSchema.index({ strategy: 1 });                        // strategy efficacy
tradeSchema.index({ session: 1 });                         // best/worst sessions
tradeSchema.index({ mistakes: 1 });                        // mistake analysis
// Compound for dashboard default view: recent trades list
tradeSchema.index({ createdAt: -1 });

export const Trade = models.Trade || model("Trade", tradeSchema);
```

**Why this shape:**
- **Enums for psychology fields** (SRS §3.1) → mistake analysis (§4.4) becomes a simple `$group` aggregation instead of fuzzy text matching.
- **`netPnL` stored, not computed at read time** → equity curve and drawdown stay fast even with thousands of trades.
- **`realizedRR` stored** → average R-multiple (§4.1) is a plain `$avg`. Optionally auto-compute in a pre-save hook.
- **Tags as string arrays** → flexible (confluences, mistakes) without extra collections; the `Strategy` exception exists only because SRS §2.2 wants a managed dropdown.

---

## 7. Step 6 — API Routes (App Router)

```ts
// app/api/trades/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Trade } from "@/lib/models/Trade";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter: any = {};
  if (searchParams.get("instrument")) filter.instrument = searchParams.get("instrument")!.toUpperCase();
  if (searchParams.get("strategy"))  filter.strategy  = searchParams.get("strategy");
  if (searchParams.get("session"))   filter.session   = searchParams.get("session");
  if (searchParams.get("from"))      filter.exitTime  = { $gte: new Date(searchParams.get("from")!) };
  if (searchParams.get("to"))
    filter.exitTime = { ...filter.exitTime, $lte: new Date(searchParams.get("to")!) };

  const trades = await Trade.find(filter).sort({ exitTime: -1 }).limit(500);
  return NextResponse.json(trades);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  // validate with your Zod schema here (lib/validations/trade.ts)
  const trade = await Trade.create(body);
  return NextResponse.json(trade, { status: 201 });
}
```

Repeat the pattern for `app/api/trades/[id]/route.ts` (GET/PATCH/DELETE) and `app/api/strategies/route.ts`.

### Server Actions alternative
For the trade form, prefer a **Server Action** (`"use server"`) over the POST route — less boilerplate, automatic revalidation with `revalidatePath("/trades")`. Keep REST routes for the export and anything non-form.

---

## 8. Step 7 — Aggregations for the SRS §4 Dashboard

Single round-trips, run inside Server Components or route handlers:

```ts
// lib/analytics.ts  (run after connectDB())
const perf = await Trade.aggregate([
  { $group: {
      _id: null,
      totalTrades:  { $sum: 1 },
      wins:         { $sum: { $cond: [{ $gt: ["$netPnL", 0] }, 1, 0] } },
      grossProfit:  { $sum: { $max: ["$netPnL", 0] } },
      grossLoss:    { $sum: { $min: ["$netPnL", 0] } },
      avgRR:        { $avg: "$realizedRR" },
      expectancy:   { $avg: "$netPnL" },
  }},
]);
// → Win rate = wins/totalTrades · Profit factor = grossProfit/|grossLoss| · Expectancy · Avg R

// Equity curve
const equity = await Trade.find({ exitTime: { $ne: null } })
  .sort({ exitTime: 1 }).select("exitTime netPnL").lean();
// → cumulative sum client-side or in aggregation

// Cost of a specific mistake (SRS §4.4) — "Cost of FOMO":
const costOfFomo = await Trade.aggregate([
  { $match: { mistakes: "FOMO_TRADE" } },
  { $group: { _id: null, total: { $sum: "$netPnL" }, count: { $sum: 1 } } },
]);

// Best/worst pairs (§4.3):
const byPair = await Trade.aggregate([
  { $group: { _id: "$instrument", pnl: { $sum: "$netPnL" }, trades: { $sum: 1 },
              winRate: { $avg: { $cond: [{ $gt: ["$netPnL", 0] }, 1, 0] } } } },
  { $sort: { pnl: -1 } },
]);
```
Max drawdown & consecutive streaks: compute from the ordered equity array in JS (cheap at personal scale; simpler than a window-function aggregation).

---

## 9. Step 8 — Screenshots: Use Vercel Blob, NOT Mongo

SRS §3.1 requires chart image uploads. Storing binary in Mongo from a Vercel function is painful. Instead:

```ts
// app/api/upload/route.ts
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const blob = await put(`charts/${Date.now()}-${file.name}`, file, { access: "public" });
  return NextResponse.json({ url: blob.url });  // → save this URL in Trade.screenshots
}
```
Free tier: 1 GB storage / 100 GB bandwidth — plenty for personal use. Cloudinary is a fine swap if you want image resizing later.

---

## 10. Step 9 — Migration Script (static files → Mongo)

One-time script, run locally with `tsx` (not deployed):

```ts
// scripts/migrate-static.ts  →  run: npx tsx scripts/migrate-static.ts
import { connectDB } from "../lib/db";
import { Trade } from "../lib/models/Trade";
import fs from "fs";

async function main() {
  await connectDB();
  const raw = JSON.parse(fs.readFileSync("./data/trades.json", "utf-8"));
  // map old field names → new schema field names here
  const docs = raw.map((t: any) => ({
    instrument: t.pair, netPnL: t.pnl, direction: t.side === "buy" ? "LONG" : "SHORT",
    entryTime: new Date(t.openedAt), exitTime: t.closedAt ? new Date(t.closedAt) : undefined,
    // ... map every field explicitly, never blindly spread
  }));
  await Trade.insertMany(docs, { ordered: false });
  console.log(`Migrated ${docs.length} trades`);
  process.exit(0);
}
main();
```

**Migration checklist:**
1. Freeze edits to static data first.
2. Write the field-mapping table explicitly (old name → new name) — do NOT `spread` blindly; enum values (sessions, mistakes) must be normalized to the new UPPER_SNAKE_CASE sets.
3. Dry-run: `insertMany` into a **separate `trades_backup` collection** or local MongoDB first; count + spot-check 10 trades.
4. Run against Atlas. Verify dashboard numbers match your old static-file calculations.
5. Keep the old static files as archive; don't delete.

---

## 11. Step 10 — CSV Export (SRS §5.1)

```ts
// app/api/export/csv/route.ts
import { connectDB } from "@/lib/db";
import { Trade } from "@/lib/models/Trade";

export async function GET() {
  await connectDB();
  const trades = await Trade.find().sort({ exitTime: 1 }).lean();
  const header = "instrument,direction,entryTime,exitTime,entryPrice,exitPrice,netPnL,strategy,session,mistakes\n";
  const rows = trades.map(t =>
    [t.instrument, t.direction, t.entryTime, t.exitTime ?? "", t.entryPrice,
     t.exitPrice ?? "", t.netPnL, t.strategy, t.session ?? "",
     (t.mistakes ?? []).join("|")].join(",")
  ).join("\n");
  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="trades-${Date.now()}.csv"`,
    },
  });
}
```
Note: for very large histories, move this to a background job — irrelevant at personal scale.

---

## 12. Performance & Ops Notes

- **Connection pooling:** `maxPoolSize: 10` in serverless; never open per-request connections without the singleton.
- **Indexes:** create them before importing data (the migration script runs after schema registration — Mongoose creates declared indexes on connect in dev; in production run `Trade.syncIndexes()` once).
- **Serverless timeout:** default Vercel functions = 10s (Hobby) — aggregations at personal scale are milliseconds; no action needed.
- **Backups:** Atlas M0 has no automated backup → weekly `mongodump` locally OR rely on the CSV export. Consider upgrading to M10 ($9/mo) for continuous backup once the journal becomes valuable.
- **Privacy (SRS §5.1):** database user has access to this DB only; Atlas encrypts at rest by default. If you ever want the app fully local-only, the same Mongoose code runs against a local `mongodb://localhost:27017` with zero changes.

---

## 13. Build Order (do it in this sequence)

| # | Task | Verifies |
|---|---|---|
| 1 | Atlas cluster + `MONGODB_URI` in Vercel env | — |
| 2 | `lib/db.ts` singleton + `Strategy` model + seed 3 strategies | connection works |
| 3 | `Trade` model + indexes | schema validates |
| 4 | Trade form (SRS: <2 min entry) → Server Action → insert | end-to-end write |
| 5 | Trades list page (GET with filters) | end-to-end read |
| 6 | Dashboard aggregations (§4.1–§4.4) | analytics match old numbers |
| 7 | Screenshot upload via Vercel Blob | media flow |
| 8 | `scripts/migrate-static.ts` → run → verify counts | migration complete |
| 9 | CSV export route | backup story done |
| 10 | Remove static-file reads; app is fully DB-driven | done |

---

## 14. Quick Reference — Collections Summary

| Collection | Purpose | Key fields |
|---|---|---|
| `trades` | One doc per trade (SRS §2–§3) | instrument, direction, prices, PnL, strategy (ref), session, emotions, mistakes[], screenshots[] |
| `strategies` | Manageable dropdown list (SRS §2.2) | name, active |
| (no user collection) | personal app | — |
| Vercel Blob (not Mongo) | chart screenshots | `charts/*` objects, URL stored in trade doc |

*End of plan. Combine with the UI prompt and your SRS; the schemas above are already aligned 1:1 with SRS sections 2–4.*
