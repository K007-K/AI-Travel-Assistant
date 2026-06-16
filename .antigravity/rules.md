# Roameo — Antigravity Agent Rules

---

## 1. Project Identity

- Project Name: Roameo
- Type: AI-powered travel planning web application (client-side SPA + Supabase backend)
- Owner: Karthik
- Goal: Generate personalized, budget-aware travel itineraries with real driving
  times, interactive maps, AI chat, and booking integration
- Architecture: React 19 + Vite 7 SPA → Supabase (Auth, DB, Edge Functions) →
  Multi-LLM AI layer (Gemini + Groq)
- Live URL: https://roameo-rz80.onrender.com
- Repo: https://github.com/K007-K/AI-Travel-Assistant

---

## 2. Tech Stack (Never Deviate From This)

### Frontend

- Framework: React 19 + Vite 7 (SPA with react-router-dom v7)
- Language: JavaScript (ES6+) — this project does NOT use TypeScript
- Styling: Tailwind CSS 3 — utility classes only
- State Management: Zustand 5 for all state (6 stores)
- Animations: Framer Motion
- Icons: Lucide React
- Maps: MapLibre GL + OpenRouteService for routing + OSRM for driving times
- Charts: Recharts (budget visualizations)
- PDF Export: jsPDF
- 3D: React Three Fiber + Three.js (landing page effects)
- Components: Custom components in `components/ui/` — no external component
  library (no shadcn/ui in this project)
- Auth: Supabase Auth (Email/Password + Google OAuth)
- Markdown: react-markdown + remark-gfm for AI chat rendering

### Backend (Supabase — No Custom Server)

- Provider: Supabase (PostgreSQL, Auth, RLS, Edge Functions, Storage)
- There is NO Express/FastAPI/Node server — everything goes through Supabase
  client + Edge Functions
- Edge Functions: `itinerary-generator`, `budget-validator`, `chat-completion`,
  `wiki-seeder` — all use Groq LLM
- RPC Functions: `match_documents` (vector similarity for RAG),
  `get_budget_summary`
- Tables: `profiles`, `trips`, `bookings`, `cost_events`

### AI / LLM Layer

- Primary: Google Gemini (Gemini 1.5 Flash, Gemini Pro) — direct API via
  `geminiService.js`
- Secondary / Fallback: Groq (Llama 3 70B, Mixtral 8x7B) — via `groq.js` and
  Supabase Edge Functions
- 7 AI Agent Prompts in `ai/prompts.js`: CORE_CHAT, TRANSLATION,
  ITINERARY_PLANNER, BUDGET_VALIDATOR, EMERGENCY_ASSISTANCE, FOOD_DISCOVERY,
  WHAT_IF_SIMULATION
- AI Manager: `api/aiManager.js` — simplified routing layer (38 LOC)
- Intent Router: `engine/intentRouter.js` — routes user chat intents to correct
  agent

### External APIs

- OSRM: Real driving time estimation (via `api/routeTime.js` with localStorage
  caching)
- Nominatim: Geocoding fallback (via `api/geocode.js`)
- OpenRouteService: Walking/driving/cycling directions for map routes
- Wikipedia: Destination enrichment (via `api/places.js` + Wikipedia REST API)
- LibreTranslate: Translation (optional)

### DevOps

- Containerization: Docker + Docker Compose (dev on port 6006, prod on port
  3000)
- Deployment: Render (Docker + Nginx)
- Nginx: SPA config with `nginx.conf.template`
- Testing: Vitest + Testing Library (160+ tests)

---

## 3. Project File Structure (Actual)

```
AI-Travel-Assistant/
├── frontend/                              # React SPA (Vite)
│   ├── src/
│   │   ├── App.jsx                        # Root component + routing
│   │   ├── main.jsx                       # Entry point
│   │   ├── index.css                      # Global styles
│   │   ├── config.js                      # App config
│   │   ├── ai/
│   │   │   └── prompts.js                 # 7 AI agent prompt templates
│   │   ├── api/
│   │   │   ├── aiManager.js               # AI provider routing (38 LOC)
│   │   │   ├── geminiService.js           # Google Gemini API client
│   │   │   ├── groq.js                    # Groq API client + Edge Function calls
│   │   │   ├── places.js                  # Nominatim + Wikipedia destination search
│   │   │   ├── geocode.js                 # Geocoding API
│   │   │   └── routeTime.js              # OSRM driving times + caching
│   │   ├── engine/                        # Core planning engine
│   │   │   ├── tripOrchestrator.js        # Main orchestration pipeline (8 phases)
│   │   │   ├── tripDurationPlanner.js     # Feasibility + overnight detection
│   │   │   ├── travelTimelineBuilder.js   # TRAVEL/EXPLORE day segmentation
│   │   │   ├── budgetAllocator.js         # Envelope-based budget allocation
│   │   │   ├── bookingSuggestionEngine.js # Booking recommendations
│   │   │   └── intentRouter.js            # Chat intent classification
│   │   ├── store/                         # Zustand state (6 stores)
│   │   │   ├── authStore.js               # Auth, user profile
│   │   │   ├── tripStore.js               # Trip CRUD, segments (~24KB)
│   │   │   ├── itineraryStore.js          # Orchestration, phase state
│   │   │   ├── budgetStore.js             # Budget tracking via Supabase RPC
│   │   │   ├── bookingStore.js            # Booking data
│   │   │   └── chatStore.js               # Chat messages, AI fallback
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── ui/                        # Reusable UI (Navbar, Button, Card, etc.)
│   │   │   ├── features/                  # ItineraryBuilder, CreateTripForm
│   │   │   ├── map/                       # MapContainer, MarkerLayer, RouteLayer
│   │   │   ├── companion/                 # AI travel companion (floating chat)
│   │   │   ├── ai/                        # AI-specific components
│   │   │   ├── home/                      # Landing page components
│   │   │   └── layout/                    # Navbar, Footer, ProtectedRoute
│   │   ├── pages/                         # 18 route-level pages
│   │   │   ├── Home.jsx, Discover.jsx, About.jsx
│   │   │   ├── Login.jsx, Signup.jsx, ForgotPassword.jsx, ResetPassword.jsx
│   │   │   ├── Itinerary.jsx, Budget.jsx, Bookings.jsx, BookingReview.jsx
│   │   │   ├── MyBookings.jsx, DestinationDetail.jsx, Favourites.jsx
│   │   │   ├── Settings.jsx, Chat.jsx, AICenter.jsx, AIControlCenter.jsx
│   │   │   ├── ai/                        # TranslationPage, EmergencyPage, FoodPage
│   │   │   └── ai-control/
│   │   ├── hooks/                         # 3 custom hooks
│   │   │   ├── useBackgroundBrightness.js
│   │   │   ├── useFavourites.js
│   │   │   └── useMapSegments.js
│   │   ├── utils/
│   │   │   ├── transportEngine.js         # Distance-tier + transport mode + overnight
│   │   │   ├── itineraryHelpers.js        # Pure utility functions
│   │   │   ├── bookingScorer.js           # Booking scoring algorithm
│   │   │   ├── currencyMap.js             # Currency mappings
│   │   │   ├── destinationImages.js       # Destination image URLs
│   │   │   ├── logger.js                  # Console logging utility
│   │   │   ├── routeService.js            # Route calculation helpers
│   │   │   └── tripDefaults.js            # Default trip values
│   │   ├── data/                          # Static data files
│   │   │   ├── destinations.json          # 18 curated destinations
│   │   │   ├── cityCoordinates.js         # City lat/lng lookup
│   │   │   ├── costOfLiving.json          # Cost of living by country
│   │   │   ├── currencyRates.json         # Currency conversion rates
│   │   │   └── emergencyData.js           # Emergency contacts by country
│   │   ├── lib/                           # Supabase client setup
│   │   ├── providers/                     # ThemeProvider
│   │   ├── config/                        # App configuration
│   │   ├── styles/                        # Additional styles
│   │   └── assets/                        # Static assets
│   ├── tests/                             # Vitest tests (160+)
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── contract/
│   │   ├── constraintCompliance.test.mjs
│   │   └── transportEngine.test.js
│   ├── public/                            # Static public assets
│   ├── Dockerfile                         # Production Docker build
│   ├── Dockerfile.dev                     # Development Docker build
│   ├── nginx.conf.template                # Nginx SPA configuration
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── vitest.config.js
├── backend/
│   └── supabase/
│       ├── functions/                     # Supabase Edge Functions
│       │   └── itinerary-generator/       # LLM prompt engineering
│       └── migrations/                    # SQL migration files
├── docs/
│   ├── ENGINE_PUBLIC_API.md               # Engine module API reference
│   ├── EDGE_FUNCTIONS.md                  # Edge Function request/response contracts
│   └── RPC_CONTRACTS.md                   # Supabase RPC function contracts
├── mcp/
│   └── mcp.config.json                    # MCP server configuration
├── supabase/                              # Supabase local config
├── src/components/                        # Legacy/shared components (being migrated)
├── REFACTOR_PROGRESS.md                   # Completed refactor tracking
├── docker-compose.yml                     # Dev + prod container orchestration
├── render.yaml                            # Render deployment config
├── .gitignore
├── .env                                   # Never commit
└── README.md
```

---

## 4. Environment Variables

- Always read secrets from environment variables — never hardcode any key, URL,
  or token
- All env vars use `VITE_` prefix (Vite exposes them to the client)
- If a new secret is needed, add it to `.env` AND `.env.example` — tell me first

### Required ENV Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Providers
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here

# Maps
VITE_ORS_API_KEY=your_openrouteservice_api_key

# Translation (optional)
VITE_TRANSLATION_API_URL=https://libretranslate.de

# App Config
VITE_APP_NAME=Roameo
VITE_APP_VERSION=1.0.0
```

---

## 5. The 7 AI Agents (Prompt-Based)

These are NOT separate microservices — they are prompt templates in
`ai/prompts.js` routed by the intent router.

| Agent                | Prompt Key             | Purpose                                  | Output Format            |
| -------------------- | ---------------------- | ---------------------------------------- | ------------------------ |
| Core Chat            | CORE_CHAT              | Main conversational entry point + router | intent, summary, route   |
| Translation          | TRANSLATION            | Accurate text translation                | translated_text, lang    |
| Itinerary Planner    | ITINERARY_PLANNER      | Day-wise itinerary generation            | itinerary JSON           |
| Budget Validator     | BUDGET_VALIDATOR       | Budget sufficiency check                 | is_valid, estimated_cost |
| Emergency Assistance | EMERGENCY_ASSISTANCE   | Emergency step-by-step guidance          | steps, immediate_action  |
| Food Discovery       | FOOD_DISCOVERY         | Restaurant/food recommendations          | recommendations array    |
| What-If Simulation   | WHAT_IF_SIMULATION     | Simulate plan changes, show deltas       | impact, cost_delta       |

---

## 6. Trip Orchestration Pipeline (8 Phases)

The orchestrator (`engine/tripOrchestrator.js`) runs this pipeline:

1. **Budget Allocation** → Envelope-based split (intercity, accommodation,
   local_transport, activity, buffer)
2. **Outbound Travel** → OSRM real driving time + overnight detection
3. **Accommodation** → Nightly accommodation segments
4. **AI Activities** → LLM-generated day-by-day activities via Edge Function
5. **Local Transport** → Pairwise commute between activities (Rule 9)
6. **Return Travel** → Return segment
7. **Reconciliation** → Verify total spend vs budget
8. **Daily Summary** → Final per-day breakdown

Key features:
- Real OSRM driving times with 30-day localStorage cache
- Overnight travel detection: budget/mid-tier routes 6–16h auto-detected as
  overnight bus/train
- Per-person budget planning with solo vs group activity generation
- Transport engine with distance-tier estimation + downgrade ladder

---

## 7. Zustand Store Architecture (6 Stores)

| Store            | Type          | Responsibility                       | Size   |
| ---------------- | ------------- | ------------------------------------ | ------ |
| `authStore`      | Domain        | Auth, user profile, Supabase session | ~8.7KB |
| `tripStore`      | Domain        | Trip CRUD, segment operations        | ~24KB  |
| `budgetStore`    | Domain        | Runtime budget via Supabase RPC      | ~7.5KB |
| `bookingStore`   | Domain        | Booking data + search                | ~5KB   |
| `itineraryStore` | Orchestration | `generateFullItinerary`, phase state | ~7.2KB |
| `chatStore`      | UI            | Messages, intent routing, AI fallback| ~5.3KB |

---

## 8. Code Quality Rules

- Use absolute imports with `@/` alias (configured in vite.config.js /
  jsconfig.json)
- All new components must be functional React components
- No inline styles — Tailwind classes only
- Use `logger.js` for console output — no raw `console.log` in production paths
- All AI responses must be parsed as structured JSON — never render raw LLM
  output
- API response handling: always try/catch with user-facing error messages
- Code-split all pages with `React.lazy()` + `Suspense` (already done in
  App.jsx)
- Protected routes: wrap with `<ProtectedRoute>` for authenticated pages

---

## 9. Build Rules

- Build ONE feature at a time — never attempt multiple features in a single run
- Always output a brief Implementation Plan before writing any code
- After finishing each feature, show what was built and wait for my approval
- If anything is ambiguous, stop and ask — do not assume
- Do not install any new npm package without asking me first and explaining why

---

## 10. Git Rules

### Commit After Every Completed Feature or Fix

- Stage all relevant changed files
- Check git status first — do not stage unrelated files
- Commit message format:
  - New feature: `feat(scope): short description`
  - Bug fix: `fix(scope): short description`
  - UI change: `ui(page-name): short description`
  - Engine change: `engine(module): short description`
  - Config/infra: `chore(config): short description`

### Commit Message Examples

```
feat(budget): add per-person budget breakdown display
fix(map): fix marker clustering on mobile viewports
ui(discover): add skeleton loaders for destination cards
engine(orchestrator): handle overnight travel edge case
chore(docker): update nginx SPA fallback config
```

### Push Rules

- Push to origin after every commit — automatically, without being asked
- Default branch is `main`
- Never force push to main

### What to Never Commit

```
.env
.env.local
.env.production
node_modules/
dist/
coverage/
*.log
.DS_Store
```

---

## 11. UI Rules

- Dark/Light mode required — use ThemeProvider + Tailwind `dark:` classes
- All pages must be responsive — mobile first approach
- Loading states: use skeleton loaders or spinner component, not plain text
- Error states: every API-calling component must handle errors visibly
- Lazy load all pages via `React.lazy()` — already configured in App.jsx
- All 11 `/ai/*` routes are wrapped with `<ProtectedRoute>`

---

## 12. Refactor Status

All 4 refactoring phases are COMPLETE:
- Phase 0: Dead code deletion (gemini.js, nginx.conf, coverage/)
- Phase 1: Structural simplification (aiManager 101→38 LOC, unified chatStore)
- Phase 2: Store split (itineraryStore 960→115 LOC + tripStore + helpers)
- Phase 2.3: Wikipedia + Nominatim integration
- Phase 3: Dead prompt cleanup (231→142 LOC, removed 5 unused agents)

---

## 13. Testing

- 160+ Vitest tests across unit, integration, contract, and constraint
  compliance
- Run with: `cd frontend && npx vitest run`
- Do NOT write automated tests unless I explicitly ask
- After each feature, give me a manual test checklist

---

## 14. What You Must Never Do

- Never add a backend server (Express, FastAPI, etc.) — Supabase handles
  everything
- Never build more than one feature per session without my approval
- Never install npm packages without asking me first
- Never hardcode any API key, URL, or secret — env variables always
- Never skip the Implementation Plan before coding
- Never commit .env, node_modules, or dist
- Never assume what I want when something is unclear — stop and ask me
