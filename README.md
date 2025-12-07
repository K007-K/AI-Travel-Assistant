# Hogwarts The Globetrotters : AI Powered Travel Planner

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan.svg)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Hogwarts The Globetrotters** is an advanced AI-powered travel planning web application that leverages Large Language Models (LLMs) to create personalized, optimized travel itineraries. Built with React and Vite, it uses the Groq API for lightning-fast AI responses to plan your perfect trip.

## 🚀 Features

### Core Capabilities
- **Smart Itinerary Generation**: Create detailed day-by-day schedules tailored to your destination and duration.
- **Budget-Aware Planning**: Optimized trip plans that respect your budget constraints (Low, Mid, High, Luxury) and currency.
- **Interactive UI**: Drag-and-drop activity reordering, completion tracking, and ratings.
- **Destination Research**: Automatically discovers hidden gems and local attractions.
- **Real-time Map Integration**: Visualizes your daily route on an interactive map.
- **Web Share**: Easily share your generated itinerary with friends and family.
- **Safety First**: AI-driven safety alerts for potentially dangerous activities or locations.
- **Dark Mode**: Fully supported dark/light theme switching.

### Supported Technologies
- **Frontend**: React 18, Vite, Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **AI/LLM**: Groq API (Llama 3, Mixtral)
- **Maps**: Leaflet / React-Leaflet
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm (Node Package Manager)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/K007-K/Hogwarts-The-Globetrotters.git
   cd Hogwarts-The-Globetrotters
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory (copy from `.env.example` if available) and add your API keys:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

- **Framework**: React + Vite
- **Styling**: Tailwind CSS + PostCSS
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Routing**: React Router DOM
- **AI Integration**: Groq SDK for AI inference
- **Maps**: Leaflet

## 🗂 Project Structure

```
src/
├── api/                # API integration (Groq, etc.)
├── assets/             # Static assets
├── components/         # Reusable UI components
│   ├── features/       # Feature-specific components (ItineraryBuilder, etc.)
│   ├── layout/         # Layout components (Header, Footer)
│   └── ui/             # Generic UI elements (Buttons, Inputs)
├── pages/              # Main application pages
├── store/              # Zustand global store definitions
├── utils/              # Helper functions and context
└── main.jsx            # Entry point
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add some amazing feature'`)
4. 🔄 Push to the branch (`git push origin feature/amazing-feature`)
5. ✨ Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
