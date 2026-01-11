# Copilot Instructions for Aggregater

This project is a lightweight, client-side web app for aggregating and analyzing horse racing CSV data. There is no build system or server; all logic runs in the browser.

## Big Picture
- **App Type:** Static HTML/CSS/JS single-page app.
- **Entry Point:** [index.html](../index.html) loads [style.css](../style.css) and [app.js](../app.js).
- **Primary Flow:**
  1. User selects a CSV file via the file input in [index.html](../index.html#L14-L20).
  2. The CSV is parsed in `parseCSV()` and stored in `allData` ([app.js](../app.js#L33-L69)).
  3. Filters initialize (`initializeFilters()`) and user-controlled filtering updates `filteredData` ([app.js](../app.js#L89-L135), [app.js](../app.js#L137-L165)).
  4. Aggregations are rendered into two tables: monthly (filtered by venue+month) and annual (venue-only) via `displayRaceDetail()` ([app.js](../app.js#L185-L290)).
  5. Basic stats such as total races are shown via `displayStats()` ([app.js](../app.js#L292-L297)).

## Data & Schema Assumptions
- CSV headers are required and mapped directly by name. `parseCSV()` expects (at least):
  - `競馬場`, `コース`, `距離`, `出走頭数`, `開催日(年)`, `開催日(月)`, `レース番号`, `金額`
- Type conversion:
  - `金額` → integer (missing/empty → 0)
  - `出走頭数`, `開催日(年)`, `開催日(月)`, `レース番号` → integers
- Rows with mismatched column counts are skipped.

## Aggregation Rules
- Monthly table uses `filteredData` (filters: selected `競馬場` and selected month) and groups by: `競馬場|レース番号|コース|距離|出走頭数`.
- Annual table uses all rows for the selected venue (ignores month) and the same grouping.
- For each group:
  - `total`: count of rows
  - `over`: count where `金額` > threshold
  - `的中率`: `over / total * 100` (displayed with 1 decimal place)
- Sort order for both tables:
  - `競馬場` (locale compare), then `レース番号` (asc), `コース` (locale compare), `距離` (asc), `出走頭数` (asc) ([app.js](../app.js#L222-L239)).

## Filters & UI Behavior
- Filters are defined in [index.html](../index.html#L22-L53) and styled in [style.css](../style.css#L52-L118).
- Required fields:
  - `競馬場` must be selected; else `applyFilters()` alerts and returns ([app.js](../app.js#L149-L165)).
- Default values set in `initializeFilters()`:
  - `monthSelect`: current month
  - `thresholdInput`: 5000
  - `raceCountMin`: 5 (UI shows 3 initially; JS adjusts to 5 if empty)
  - `hitRateMin`: 50
- Live updates:
  - Threshold, race count min, and hit rate min inputs trigger re-render via `displayData()`.
  - Venue and month selections trigger `applyFilters()` ([app.js](../app.js#L11-L31)).
- Reset button:
  - Clears `venueFilter` and sets month to current ([app.js](../app.js#L167-L183)).

## Developer Workflows
- **Run locally:** Open [index.html](../index.html) in a browser (double-click on Windows or serve via a simple static server).
- **No build step:** There is no `package.json` or bundler; update files directly.
- **Testing:** Manual testing with sample CSVs (e.g., [matome.csv](../matome.csv)). Ensure headers match expectations above.
- **Debugging:** Use browser devtools; console logs are present in `parseCSV()` and `applyFilters()`.

## Conventions & Patterns
- **Single source of truth:** `allData` holds parsed data; `filteredData` mirrors current filter selection.
- **DOM IDs:** IDs in [index.html](../index.html) are referenced directly in [app.js](../app.js); keep IDs stable when modifying markup.
- **Visibility toggling:** `filterSection` and `statsSection` are hidden until a CSV is loaded ([app.js](../app.js#L73-L87)).
- **Tables:** Monthly → `raceDetailBody`; Annual → `raceDetailBody2` ([index.html](../index.html#L63-L107)).

## Extension Points
- Adding new metrics: extend group objects in `monthlyAgg`/`annualAgg` and render in `displayRaceDetail()`.
- Additional filters: update `initializeFilters()` and wire events like existing inputs; ensure `applyFilters()` updates `filteredData` and calls `displayData()`.
- CSV schema changes: modify `parseCSV()` header mapping and type conversions accordingly.

## Examples
- To add a filter for distance range:
  - Add inputs in [index.html](../index.html#L22-L53) and style in [style.css](../style.css#L52-L118).
  - Read values in `applyFilters()` and include distance checks when filtering `allData` → `filteredData`.
  - Reuse `onChangeRecalc` to trigger `displayData()` on input events.

---
If any part of these instructions seems unclear or incomplete (e.g., CSV header variations or desired additional metrics), please point it out and I'll refine this document.