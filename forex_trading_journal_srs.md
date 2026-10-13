# Software Requirements Specification (SRS)
## Personal Forex Trading Journal

---

## 1. Introduction & Purpose

This document outlines the requirements for a custom-built, personal Forex Trading Journal app. Unlike generic spreadsheets, this system is designed to track not just financial metrics, but the psychological, strategic, and visual elements of trade execution to facilitate deliberate practice and systemic improvement.

**Primary Objective:** To build a frictionless, private system that logs trade data, measures strategy efficacy, and highlights psychological patterns affecting profitability.

---

## 2. Functional Requirements: Core Data Logging

The app must allow the user to input comprehensive details for every trade. To minimize data entry fatigue, this should be split into quantitative execution data and qualitative analysis.

### 2.1 Execution Data (Quantitative)
* **Instrument:** Currency pair (e.g., EUR/USD, GBP/JPY).
* **Direction:** Long (Buy) or Short (Sell).
* **Timestamps:** Exact Entry and Exit Date/Time.
* **Pricing:** Entry Price, Stop Loss (SL), Take Profit (TP), and actual Exit Price.
* **Position Sizing:** Lot size or risk percentage.
* **Costs:** Commissions, Swaps, and Spread.
* **Result:** Gross PnL (Profit and Loss) and Net PnL.

### 2.2 Setup & Strategy (Qualitative)
* **Strategy Used:** Dropdown of personal strategies (e.g., Breakout, Supply/Demand, SMC).
* **Timeframe:** Execution TF (e.g., 5m, 15m) and Trend TF (e.g., 4H, Daily).
* **Confluences:** Checkboxes for setup criteria met.
* **Risk/Reward:** Planned R:R vs. Realized R:R.
* **Session:** Trading session (Asian, London, NY).

---

## 3. Functional Requirements: Psychology & Media

### 3.1 Emotional and Visual Tracking
Trading is highly psychological. The system must capture the trader's mental state before and after the execution, along with visual proof of the setup.
* **Pre-Trade Emotion:** Scale of 1-5 or tags (e.g., Confident, FOMO, Anxious, Revenge).
* **Post-Trade Emotion:** Tags for how the exit was managed (e.g., Closed early, Held to TP, Moved SL to break-even).
* **Chart Screenshots:** Image uploads for Entry timeframe and Higher timeframe context.
* **Mistakes Log:** Specific dropdown for errors (e.g., Over-leveraged, Ignored news, Chased price).
* **Lessons Learned:** Free-text journal entry for reflection.

---

## 4. Functional Requirements: Analytics Dashboard

The dashboard translates raw logs into actionable insights. It must automatically calculate and display the following key performance indicators (KPIs).

### 4.1 Core Performance Metrics
* **Win Rate:** Percentage of profitable trades.
* **Profit Factor:** Gross Profit divided by Gross Loss.
* **Expectancy:** Average amount expected to be won/lost per trade.
* **Average R-Multiple:** Average realized risk-to-reward.

### 4.2 Drawdown & Equity
* **Equity Curve:** Visual line chart of account balance over time.
* **Max Drawdown:** Largest peak-to-valley drop in balance.
* **Consecutive Streaks:** Max consecutive wins and losses.

### 4.3 Strategy Filtering
* **Best/Worst Pairs:** PnL filtered by currency pair.
* **Best/Worst Sessions:** Profitability by time of day (London vs. NY).
* **Strategy Efficacy:** Win rate isolated by strategy tag.

### 4.4 Mistake Analysis
* **Cost of Mistakes:** Total PnL lost tagged under specific errors (e.g., "Cost of FOMO").
* **Most Frequent Error:** Tally of the most commonly tagged mistake.

---

## 5. Non-Functional Requirements

### 5.1 Data, Security, and UX (Personal Use)
* **Data Privacy:** As a personal app, data should be stored securely. Local storage (SQLite/IndexedDB) or a secure private cloud database (Firebase/Supabase) is sufficient.
* **Frictionless UX:** Data entry must take under 2 minutes per trade. Default values (e.g., current date/time) should auto-populate.
* **Exportability:** Ability to export all trade data to CSV for backup or advanced spreadsheet modeling.
* **Responsive Design:** Must work cleanly on desktop (for detailed chart reviews) and mobile (for quick on-the-go logging).

---

## 6. Future Phase Considerations (V2)

### 6.1 Advanced Features
* **Broker API Integration:** Auto-syncing trades via MetaTrader, cTrader, or Oanda APIs to eliminate manual entry of open/close prices.
* **Economic Calendar Sync:** Overlaying high-impact news events (CPI, NFP) on the equity curve or trade logs to spot correlation.
* **Backtesting Mode:** A separate environment to log simulated trades without mixing data with the live forward-testing account.