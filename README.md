# Roameo : AI-Powered Travel Planner

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4.svg)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Deployed-2496ED.svg)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Roameo** is an advanced AI-powered travel planning web application that leverages multiple LLM providers (Google Gemini & Groq) to create personalized, optimized travel itineraries. Built with React, Supabase, and modern web technologies, it features smart budgeting, interactive maps, real-time AI chat, and a comprehensive booking system.

🌐 **Live Demo**: [https://roameo-rz80.onrender.com](https://roameo-rz80.onrender.com)

---

## 🌟 Key Features

- **AI-Powered Itinerary Generation** — Create detailed day-by-day schedules tailored to your destination, duration, and preferences
- **Multi-LLM Support** — Powered by Google Gemini and Groq (Llama 3, Mixtral) for fast, intelligent responses
- **Smart Budget Planning** — Budget-aware trip plans with expense tracking, category breakdowns, and currency support
- **Interactive Maps** — Real-time route visualization with Leaflet, walking/driving directions via OpenRouteService
- **AI Travel Companion** — Real-time chat with an AI assistant for travel tips, cultural insights, and recommendations
- **Destination Discovery** — Explore curated destinations with detailed info, weather, and local highlights
- **Hotel & Flight Booking** — Integrated booking system with search, comparison, and management
- **PDF Export** — Download beautifully formatted itineraries as PDF documents
- **Dark/Light Mode** — Fully themed UI with smooth transitions
- **Authentication** — Secure auth via Supabase (Email/Password + Google OAuth)
- **Responsive Design** — Optimized for desktop, tablet, and mobile screens

---

## 🏗️ System Architecture

Roameo follows a modern client-side architecture with a Supabase backend and AI orchestration layer:

```mermaid
graph TD
    A[User] --> B[React Frontend]
    B --> C[Supabase Auth]
    B --> D[Supabase Database]
    B --> E[AI Engine]
    
    E --> F[Google Gemini API]
    E --> G[Groq API]
    
    B --> H[Map Services]
    H --> I[OpenRouteService]
    H --> J[Leaflet / OSM]
    
    B --> K[Booking Engine]
    
    subgraph Backend
    C
    D
    end
    
    subgraph AI Providers
    F
    G
    end
    
    subgraph Maps
    I
    J
    end
    
    style A fill:#f9f,stroke:#333
    style B fill:#61dafb,stroke:#333
    style D fill:#3ECF8E,stroke:#333
    style E fill:#ff6b6b,stroke:#333
```

### Core Modules

1. **AI Engine** (`services/ai/`)
   - Multi-provider LLM orchestration (Gemini + Groq)
   - Prompt engineering for itinerary generation
   - Structured JSON parsing of AI responses
   - Fallback logic between providers

2. **Itinerary Generator** (`store/itineraryStore.js`)
   - Creates optimized daily schedules with time slots
   - Handles multi-day trip planning
   - Activity management (add, edit, delete, reorder)

3. **Budget Manager** (`store/budgetStore.js`)
   - Real-time expense tracking per trip
   - Category-wise breakdown (food, transport, accommodation, activities)
   - Multi-currency support with conversion
   - AI-powered budget analysis and recommendations

4. **Booking System** (`store/bookingStore.js`)
   - Hotel and flight search integration
   - Booking management and status tracking
   - Scoring algorithm for optimal recommendations

5. **Map & Route Engine** (`components/map/`)
   - Interactive Leaflet maps with custom markers
   - Route visualization via OpenRouteService
   - Walking/driving/cycling directions
   - Activity highlight and focus controls

6. **AI Companion** (`components/companion/`)
   - Context-aware travel chat assistant
   - Cultural tips, safety alerts, local recommendations
   - Conversation history management

---

## 🚀 Features

### Core Capabilities
- **Multi-Agent AI System** — Specialized prompts for planning, budgeting, and recommendations
- **Natural Language Understanding** — Parse complex travel requests and preferences  
- **Destination Research** — Discover hidden gems and popular attractions
- **Smart Itinerary Generation** — Create realistic, well-paced daily schedules
- **Budget-Aware Planning** — Plans optimized for Low, Mid, High, or Luxury budgets
- **Real-time Map Integration** — Visualize routes with turn-by-turn directions
- **Drag & Drop** — Reorder activities within your itinerary
- **Safety Alerts** — AI-driven warnings for potentially dangerous activities or locations
- **Web Share** — Share generated itineraries with friends and family
- **PDF Export** — Download itineraries as beautifully formatted PDF documents

### Supported LLM Providers
| Provider | Models | Use Case |
|----------|--------|----------|
| **Google Gemini** | Gemini 1.5 Flash, Gemini Pro | Primary itinerary generation |
| **Groq** | Llama 3 70B, Mixtral 8x7B | Fast inference, fallback provider |

### Data Flow
```
User Input → AI Engine → Structured Itinerary → Map Rendering
                ↓                    ↓
         Budget Analysis      Supabase Storage
                ↓                    ↓
         Recommendations       Trip Management
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm (Node Package Manager)
- A [Supabase](https://supabase.com) project (free tier works)
- API keys for [Google Gemini](https://aistudio.google.com/) and/or [Groq](https://console.groq.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/K007-K/AI-Travel-Assistant.git
   cd AI-Travel-Assistant
   ```

2. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `frontend/` directory:
   ```env
   # Supabase
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Providers
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_GROQ_API_KEY=your_groq_api_key

   # Maps
   VITE_ORS_API_KEY=your_openrouteservice_api_key

   # App Config
   VITE_APP_NAME=Roameo
   VITE_APP_VERSION=1.0.0
   VITE_TRANSLATION_API_URL=https://libretranslate.de
   ```

4. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL migrations in `backend/supabase/migrations/` via the SQL Editor
   - Enable Google OAuth (optional) under Authentication → Providers

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `VITE_GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `VITE_GROQ_API_KEY` | ⚡ | Groq API key (fallback AI provider) |
| `VITE_ORS_API_KEY` | ⚡ | OpenRouteService key (for map routes) |
| `VITE_TRANSLATION_API_URL` | ❌ | LibreTranslate endpoint |
| `VITE_APP_NAME` | ❌ | App display name (default: Roameo) |

### Supabase Tables
The following tables are required (migrations in `backend/supabase/migrations/`):
- `profiles` — User profiles and preferences
- `trips` — Trip data with itineraries
- `bookings` — Hotel/flight booking records
- `cost_events` — Budget tracking entries

---

## 🛠️ Tech Stack

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/></a>
  <a href="https://www.docker.com"><img src="https://img.shields.io/badge/Docker-Deploy-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/></a>
  <a href="https://leafletjs.com"><img src="https://img.shields.io/badge/Leaflet-Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet"/></a>
  <a href="https://ai.google.dev"><img src="https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"/></a>
</p>

### Core Dependencies
| Category | Technology |
|----------|------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3 |
| **State Management** | Zustand |
| **Backend / Auth** | Supabase (PostgreSQL, Auth, RLS) |
| **AI / LLM** | Google Gemini API, Groq SDK |
| **Maps** | Leaflet, React-Leaflet, OpenRouteService |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **PDF Export** | jsPDF |
| **Deployment** | Docker, Nginx, Render |

---

## 🗂 Project Structure

```
AI-Travel-Assistant/
├── frontend/                    # React client application
│   ├── src/
│   │   ├── api/                 # External API wrappers
│   │   │   ├── places.js        # Places/destinations API
│   │   │   └── weather.js       # Weather data API
│   │   ├── components/
│   │   │   ├── ai/              # AI chat components
│   │   │   ├── companion/       # AI travel companion
│   │   │   ├── features/        # Feature-specific components
│   │   │   ├── home/            # Landing page & dashboard
│   │   │   ├── layout/          # Navbar, footer, protected routes
│   │   │   ├── map/             # Map, markers, route layers
│   │   │   └── ui/              # Reusable UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Supabase client setup
│   │   ├── pages/               # Route-level page components
│   │   │   ├── Home.jsx         # Landing / Dashboard
│   │   │   ├── Discover.jsx     # Destination explorer
│   │   │   ├── Itinerary.jsx    # Trip itinerary manager
│   │   │   ├── Budget.jsx       # Budget planner
│   │   │   ├── Bookings.jsx     # Booking search
│   │   │   ├── AIControlCenter  # AI orchestration dashboard
│   │   │   ├── Chat.jsx         # AI companion chat
│   │   │   └── Settings.jsx     # User preferences
│   │   ├── services/
│   │   │   └── ai/              # AI service layer (Gemini, Groq)
│   │   ├── store/               # Zustand state stores
│   │   │   ├── authStore.js     # Authentication state
│   │   │   ├── itineraryStore.js# Trip & itinerary CRUD
│   │   │   ├── budgetStore.js   # Budget management
│   │   │   ├── bookingStore.js  # Booking state
│   │   │   └── themeStore.js    # Dark/light mode
│   │   ├── utils/               # Utility functions
│   │   └── App.jsx              # Root component & routing
│   ├── public/                  # Static assets
│   ├── Dockerfile               # Multi-stage Docker build
│   ├── nginx.conf.template      # Nginx SPA configuration
│   └── package.json             # Dependencies & scripts
├── backend/
│   └── supabase/
│       └── migrations/          # SQL migration files
├── render.yaml                  # Render deployment config
├── docker-compose.yml           # Local container orchestration
└── README.md                    # This file
```

---

## 🚀 Deployment

### Local Development
```bash
cd frontend
npm install
npm run dev
```

### Docker (Local)
```bash
docker-compose up --build
```
Access the app at `http://localhost:3000`

### Production (Render)
The app is deployed on [Render](https://render.com) using Docker:

1. Connect your GitHub repository to Render
2. Set the environment variables in the Render dashboard
3. Deploy — Render will build the Docker image and serve via Nginx

**Live URL**: [https://roameo-rz80.onrender.com](https://roameo-rz80.onrender.com)

---

## 🧪 Testing

### Demo Credentials
To explore the app without signing up:
```
Email: demo@roameo.com
Password: demo1234
```

### Test Scenarios
1. **Create a Trip** — Go to My Trips → Create a new trip to Vizag for 3 days
2. **Generate Itinerary** — Use the AI to auto-generate a day-by-day plan
3. **Budget Planning** — Set a budget and track expenses by category
4. **Discover** — Browse curated destinations on the Discover page
5. **AI Chat** — Ask the AI companion for travel recommendations
6. **Bookings** — Search and compare hotels for your destination

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add some amazing feature'`)
4. 🔄 Push to the branch (`git push origin feature/amazing-feature`)
5. ✨ Open a Pull Request

### Development Setup
```bash
git clone https://github.com/K007-K/AI-Travel-Assistant.git
cd AI-Travel-Assistant/frontend
npm install
npm run dev
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://react.dev) — UI framework
- [Supabase](https://supabase.com) — Backend, auth, and database
- [Google Gemini](https://ai.google.dev/) — Primary AI provider
- [Groq](https://groq.com/) — High-performance LLM inference
- [Leaflet](https://leafletjs.com/) — Interactive maps
- [OpenRouteService](https://openrouteservice.org/) — Routing and directions
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [Render](https://render.com) — Cloud deployment

---

<div align="center">
Made with ❤️ by <a href="https://github.com/K007-K">K Karthik</a>
</div>
