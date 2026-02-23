# AI Travel Assistant — Refactoring Progress

> **Last updated**: 2026-02-20\
> **Branch**: `main`\
> **Status**: Phase 2 complete, Phases 2.3 + 3 remaining

---

## ✅ COMPLETED

### Phase 0 — Dead Code Deletion (`fddc4d7`)

- [x] Deleted `frontend/src/api/gemini.js` (unused, Groq replaced it)
- [x] Deleted `nginx.conf` (dead — Dockerfile uses `.template`)
- [x] Removed committed `coverage/` directory from Git + added to `.gitignore`
- [x] Removed `@google/generative-ai` from `package.json`
- [x] Validated: lint (0 errors), tests (124/124), build OK

### Phase 1 — Structural Simplification (`c56f5f9`)

- [x] Simplified `aiManager.js` (101 → 38 LOC)
  - Removed dead `MODEL_REGISTRY`, switch statement, `routeIntent()`, `_context`
    param
  - `makeGroqRequest` in `groq.js` ignores model param — selection is
    server-side
  - Same `runAgent(agentId, userInput)` signature — no consumer changes needed
- [x] Merged `chatStore.js` + `companionStore.js` → unified `chatStore.js`
  - Intent routing runs first (deterministic queries)
  - Falls back to AI via `makeGroqRequest` → Edge Function
  - Normalized message format to `content` field
  - Deleted `companionStore.js`
  - Updated `AICompanion.jsx` (`isProcessing` → `isLoading`, `message.text` →
    `message.content`)
- [x] Extracted data tables from `transportEngine.js`
  - Created `frontend/src/data/currencyRates.json` (100+ currencies)
  - Created `frontend/src/data/costOfLiving.json` (PPP indices + region
    defaults)
  - `transportEngine.js` now imports from JSON files
- [x] Wrapped all 11 `/ai/*` routes with `ProtectedRoute` in `App.jsx`
- [x] Validated: lint (0 errors), tests (124/124), build OK

### Phase 2 — Store Refactor (`b38192c`)

- [x] Split `itineraryStore.js` (960 LOC, 33 functions) into 3 focused files:
  - `utils/itineraryHelpers.js` (~140 LOC) — pure utilities (time scheduling,
    `buildDaysFromSegments`)
  - `store/tripStore.js` (~500 LOC) — trip data CRUD + segment operations
  - `store/itineraryStore.js` (115 LOC) — orchestration only
    (`generateFullItinerary` + state)
- [x] Updated all 8 consumer files:
  - `ItineraryBuilder.jsx` — split imports between tripStore + itineraryStore
  - `AIControlCenter.jsx` — tripStore + direct
    `allocateBudget`/`reconcileBudget`
  - `chatStore.js` — reads from both tripStore + itineraryStore
  - `Settings.jsx`, `Itinerary.jsx`, `Budget.jsx`, `BookingReview.jsx`,
    `BudgetSelectionModal.jsx` — switched to tripStore
- [x] Removed dead gateway functions (`deriveAllocation`,
      `deriveReconciliation`)
- [x] Validated: lint (0 errors), tests (124/124), build OK

---

## 🔲 REMAINING

### Phase 2.3 — Extract `places.js` destination data to JSON (~30 min)

- [ ] Create `frontend/src/data/destinations.json` — extract the return array
      from `getCuratedDestinations()` (lines 32-447 of `places.js`)
- [ ] Rewrite `places.js` to ~30 LOC: import JSON, export search/filter
      functions
- [ ] Verify `Discover.jsx`, `DestinationDetail.jsx`, and `destinationImages.js`
      still work
- [ ] Run lint + test + build
- [ ] Commit and push

### Phase 3 — Cleanup and Stabilization (~1 hour)

- [ ] 3.1: Verify `itineraryStore.js` is focused (orchestration only, no CRUD)
- [ ] 3.2: Clean up unused `prompts.js` entries
  - Active agents (7): `BUDGET_VALIDATOR`, `EMERGENCY_ASSISTANCE`,
    `ITINERARY_PLANNER`, `WHAT_IF_SIMULATION`, `FOOD_DISCOVERY`, `TRANSLATION`,
    `CORE_CHAT`
  - Dead agents to remove (6): `CULTURAL_CONTEXT`, `VOICE_TRANSCRIPTION`,
    `SAFETY_ADVISORY`, `PERSONALIZATION`, `MODEL_ROUTER`, `EXPLAINABILITY`
- [ ] 3.3: Final lint + test + build
- [ ] 3.4: Commit and push

---

## 📊 CURRENT STATE

### Store Structure (6 stores: 4 domain + 1 orchestration + 1 UI)

| Store               | Type          | Responsibility                                     |
| ------------------- | ------------- | -------------------------------------------------- |
| `authStore.js`      | Domain        | Auth, user profile                                 |
| `tripStore.js`      | Domain        | Trip data CRUD, segment operations                 |
| `budgetStore.js`    | Domain        | Runtime budget tracking via Supabase RPC           |
| `bookingStore.js`   | Domain        | Booking data                                       |
| `itineraryStore.js` | Orchestration | `generateFullItinerary`, orchestration phase state |
| `chatStore.js`      | UI            | Chat messages, intent routing, AI fallback         |

### API Files (2 active)

| File        | Purpose                                             |
| ----------- | --------------------------------------------------- |
| `groq.js`   | Single AI entry point → Edge Function → Groq API    |
| `places.js` | Destination search/filter (data extraction pending) |

### Data Files

| File                      | Status                 |
| ------------------------- | ---------------------- |
| `data/currencyRates.json` | ✅ Created (Phase 1)   |
| `data/costOfLiving.json`  | ✅ Created (Phase 1)   |
| `data/destinations.json`  | 🔲 Pending (Phase 2.3) |

### Deleted Files

| File                      | Phase | Reason                            |
| ------------------------- | ----- | --------------------------------- |
| `api/gemini.js`           | 0     | Unused, Groq replaced it          |
| `nginx.conf`              | 0     | Dead, Dockerfile uses `.template` |
| `coverage/`               | 0     | Build artifacts                   |
| `store/companionStore.js` | 1     | Merged into `chatStore.js`        |

### Git Commits (chronological)

| Commit    | Phase | Description                                                  |
| --------- | ----- | ------------------------------------------------------------ |
| `fddc4d7` | 0     | Remove dead code                                             |
| `c56f5f9` | 1     | Merge chat, simplify aiManager, extract data, protect routes |
| `b38192c` | 2     | Split itineraryStore into tripStore + itineraryHelpers       |

---

## 🎯 INTERVIEW NARRATIVE (3 stages)

1. **Hygiene** — Removed dead code and unused dependencies
2. **Simplification** — Consolidated duplicate systems, separated data from
   logic, enforced security
3. **Separation of Concerns** — Split monolithic store into domain-focused
   stores with clear ownership

### Key talking points:

- tripStore owns "what data exists" (CRUD + segments)
- itineraryStore owns "how data is generated" (orchestration lifecycle)
- budgetStore owns "how much was spent" (runtime financials via RPC)
- Budget has exactly 2 owners: allocator at generation time, RPC at runtime
- Single AI path: `groq.js` → Edge Function → Groq API
- Transport is deterministic (PPP lookup tables, not AI)
- All 11 AI routes now require authentication
