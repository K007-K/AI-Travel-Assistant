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

<div align="center">
	<img width="50" src="https://user-images.githubusercontent.com/25181517/183897015-94a058a6-b86e-4e42-a37f-bf92061753e5.png" alt="React" title="React"/>
	<img width="50" src="https://user-images.githubusercontent.com/25181517/192158954-f88b5814-7510-4481-b5e5-678d52845efc.png" alt="Vite" title="Vite"/>
	<img width="50" src="https://user-images.githubusercontent.com/25181517/202896760-337261ed-ee92-4979-84c4-d4b829c7355d.png" alt="Tailwind CSS" title="Tailwind CSS"/>
	<img width="50" src="https://user-images.githubusercontent.com/25181517/183890598-19a0fe2d-b54f-4206-a2e1-253c30381a55.png" alt="JavaScript" title="JavaScript"/>
	<img width="50" src="https://user-images.githubusercontent.com/25181517/183568594-85e280a7-0d7e-4d1a-9028-c8c2209e073c.png" alt="Node.js" title="Node.js"/>
    <img width="50" src="https://user-images.githubusercontent.com/25181517/183423507-c056a6f9-1ba8-4312-a350-19bcbc5a8697.png" alt="Python" title="Python"/>
    <img width="50" src="https://user-images.githubusercontent.com/25181517/183898674-75a4a1b1-f960-4ea9-abcb-637170a00a75.png" alt="CSS" title="CSS"/>
    <img width="50" src="https://user-images.githubusercontent.com/25181517/183898054-b3d693d4-dafb-4808-a509-bab54cf5de34.png" alt="Bootstrap" title="Bootstrap"/>
</div>

### Core Dependencies
- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend/DB**: Supabase
- **AI**: Groq SDK (Llama 3, Mixtral)
- **State**: Zustand
- **Maps**: Leaflet / React-Leaflet
- **PDF**: jsPDF
- **Icons**: Lucide React

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
