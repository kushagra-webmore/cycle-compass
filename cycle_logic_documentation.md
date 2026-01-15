# Cycle Compass: Logic & Calculations Documentation

This document outlines the core logic, mathematical formulas, and algorithms used in the Cycle Compass application for tracking menstrual cycles, predicting phases, and generating AI insights.

## 1. Phasing Logic

The application divides the menstrual cycle into 5 distinct phases. The logic is deterministic based on the `currentDay` of the cycle (calculated from the cycle start date).

**Source File:** `backend/src/utils/cycle.ts`

### Constants
- **`LUTEAL_LENGTH`**: Fixed at **14 days**. This is the standard medical assumption for the post-ovulation phase.
- **`DEFAULT_PERIOD_LENGTH`**: Defaults to **5 days** if not specified by the user.

### Calculation Algorithm
Given a `cycleLength` (e.g., 28 days) and `periodLength` (e.g., 5 days):

1.  **Calculate Key Milestones:**
    -   `Ovulation Day` = `cycleLength - 14`
    -   `Fertile Window Start` = `Ovulation Day - 5`
    -   `Fertile Window End` = `Ovulation Day + 1`

2.  **Determine Phase by Day:**
    The `currentDay` (1-indexed) determines the phase:

    | Phase | Condition | Description |
    | :--- | :--- | :--- |
    | **MENSTRUAL** | `day <= periodLength` | The bleeding phase. Starts day 1. |
    | **FOLLICULAR** | `day < Fertile Start` AND `day > periodLength` | The gap between the period and the fertile window. |
    | **FERTILE** | `day >= Fertile Start` AND `day <= Fertile End` | High probability of conception. |
    | **OVULATION** | `day === Ovulation Day` | Peak fertility. (Subset of Fertile phase). |
    | **LUTEAL** | `day > Fertile End` | Post-ovulation until the next cycle. |

### Edge Handling
-   If the cycle is very short (e.g., 21 days), the **Follicular** phase may be skipped entirely if the **Fertile** window starts immediately after or during the **Menstrual** phase.
-   The logic prioritizes: `Menstrual` > `Fertile` > `Luteal`.

---

## 2. Cycle Math & Predictions

### Current Cycle Context
**Source:** `getCycleContext` in `backend/src/utils/cycle.ts`

-   **Current Day Calculation**:
    ```typescript
    DaysSinceStart = floor((Today - StartDate) / (1000 * 60 * 60 * 24))
    CurrentDay = (DaysSinceStart % CycleLength) + 1
    ```
    *Note: This modulo logic assumes a perfectly repeating cycle if no new cycle is manually logged, providing a continuous "projection" even if the user forgets to log the next start date.*

### Cycle Predictions
Currently, the system uses a **naive statistical average** for predictions rather than complex recurrence models (like Kalman filters).

-   **Next Cycle Start**: Projected as `Last Cycle Start + Average Cycle Length`.
-   **Average Cycle Length**: Calculated dynamically in frontend charts by averaging the length of recorded history, filtering out outliers (ignored if < 15 days or > 100 days).

---

## 3. AI Insights & Personalization

The application uses **Google Gemini 2.5 Flash** to generate dynamic, personalized insights.

**Source:** `backend/src/services/ai.service.ts`

### Daily Insights (`/daily-insights`)
-   **Inputs**: Phase, Cycle Day, Symptoms (Mood, Pain), User Goal (Tracking/Conceive).
-   **Outputs**:
    -   **Food**: Nutrition advice tailored to the cycle phase.
    -   **Activity**: Exercise recommendations (e.g., "Rest" during Menstrual, "HIIT" during Ovulation).
    -   **Wisdom**: Daily affirmation or tip.
-   **Caching**: Responses are cached in the `ai_interactions` table for 24 hours to minimize API costs and latency.

### Partner Explainer (`/partner-guidance`)
-   Generates advice for the user's partner.
-   **Logic**: Checks `consent_settings` first. If allowed, it sends the user's **Phase**, **Mood Summary**, and **Energy Summary** to the LLM to generate actionable tips (e.g., "Be patient," "Offer comfort food").

### Journal Summary
-   Aggregates unstructured text entries from the user's journal.
-   Uses LLM to summarize emotional trends and symptoms over a period.

---

## 4. Visualizations & Trends

**Source:** `frontend/src/components/dashboard/CycleHistoryChart.tsx`

### Cycle History Chart
-   **Type**: Bar Chart (Recharts).
-   **X-Axis**: Cycle Start Dates.
-   **Y-Axis**: Cycle Length (Days).
-   **Metrics**:
    -   **Bar**: Individual cycle length.
    -   **Reference Line**: User's Average Cycle Length.
    -   **Standard Reference**: 28-day marker.
-   **Logic**: Calculates length as `Date(Cycle[N+1]) - Date(Cycle[N])`.

### Daily Insights Cards
-   Visual components that display the AI-generated JSON data (Nourish, Move, Insight).

---

## Summary of Logic Flow

1.  **User logs Cycle Start**: Saves to `cycles` table.
2.  **Backend Helper (`getCycleContext`)**: Calculates `currentDay` and `phase` on every fetch.
3.  **Frontend**:
    -   Fetches `Current Cycle`.
    -   Calls `/daily-insights` → Backend checks cache or calls Gemini AI.
    -   Displays Phase Card (Math-based) and Insight Cards (AI-based).
