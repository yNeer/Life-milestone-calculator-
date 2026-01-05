
That is the correct link! Since you are on the Edit page for your README.md, you can simply delete everything currently in that file and paste the code below.
I have updated the Installation section with your actual GitHub username (yNeer) and repository name so it works perfectly for anyone who clones it.
📋 Copy and Paste this into GitHub:
# ⏳ Life Milestones Calculator & Matrix

> **Discover the mathematical poetry of your life.**
> An advanced chronological engine that calculates hidden milestones based on Powers of 10, Repdigits, Fibonacci sequences, and cosmic cycles.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8?logo=tailwindcss)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## 📖 Overview

The **Life Milestones Calculator** goes beyond standard birthdays. It visualizes your existence through a mathematical lens. By inputting a birth date and time, the application generates a "Life Matrix"—a dashboard of chronological achievements including your 1 billionth second, 10,000th day, and Golden Ratio (Fibonacci) ages.

It features a **Cinematic Video Export Studio**, allowing users to generate high-quality, 60fps data-driven videos of their "Total Existence" for social media sharing.

---

## ✨ Key Features

### 🧮 Advanced Chronological Engine
* **Powers of 10:** Calculates 10k days, 1M minutes, 1B seconds.
* **Repdigits:** Highlights aligned numbers like 11,111 days or 33,333 hours.
* **Math Sequences:** Identifies Fibonacci ages, Pi days, and Palindromic dates.
* **Cosmic Stats:** Calculates Earth rotations and Sun orbits based on exact birth time.

### 🎨 Cinematic Video & Image Studio
* **Canvas-Based Video Engine:** A custom-built rendering engine that generates **WebM (VP9)** videos client-side.
* **Rolling Numbers:** Smooth interpolation of stats from 0 to current value.
* **Staggered Animations:** Elements enter sequentially (Intro -> Grid -> Finale).
* **Beat Sync:** Visual elements pulse to a 72 BPM heartbeat rhythm.
* **5 Visual Styles:** Cinematic, Neon Cyber, Clean Air, Stardust, and Retro Vibe.
* **High-Res Export:** Download cards as **4K PNGs**, **SVGs**, or **PDFs**.

### 🖥️ Modern UI/UX
* **Bento Grid / Mosaic Layout:** A responsive, masonry-style dashboard displaying live widgets.
* **Glassmorphism:** Heavy use of backdrop filters, translucent layers, and mesh gradients.
* **Live Heartbeat:** Real-time counter of years, months, weeks, days, hours, minutes, and seconds.
* **Theming System:** 10+ preset themes (Amoled, Cyberpunk, Sunset, Nature, etc.) that instantly update CSS variables across the app.

### 📊 Data Visualization
* **Interactive Timeline:** Pinch-to-zoom scatter plot of your entire life's milestones using `Recharts`.
* **Radial Progress:** Visual representation of life lived vs. a 100-year cap.
* **Heatmaps:** Density graphs showing years with the most significant milestones.

### 📱 PWA & Offline Support
* **Fully installable** as a Progressive Web App (PWA).
* **Offline capability** for viewing previously calculated stats.

---

## 🛠️ Tech Stack

* **Core:** React 19, TypeScript, Vite.
* **Styling:** Tailwind CSS (v3), CSS Variables for Theming.
* **Icons:** Lucide React.
* **Date Math:** date-fns (Robust date arithmetic).
* **Charts:** recharts (Responsive SVG charts).
* **Export:**
    * `html-to-image`: DOM rasterization.
    * `jspdf`: PDF generation.
    * `Native Canvas API`: Custom frame-by-frame video rendering.

---

## 👨‍💻 Developer Key Points

### 1. The Video Rendering Engine (`ShareModal.tsx`)
Unlike simple screen recorders, this app uses a **procedural animation loop**.
* **Technique:** It draws to an invisible HTML5 `<canvas>` element using `requestAnimationFrame`.
* **Recording:** The canvas stream is captured using `MediaRecorder` at 8Mbps bitrate.
* **Performance:** Elements are drawn mathematically per frame, ensuring 60fps smoothness regardless of device DOM lag.
* **Sync:** Animations are time-based functions (e.g., `easeOutBack`), not CSS animations, ensuring perfect sync in the exported video.

### 2. Theming Architecture (`utils/themes.ts`)
The app avoids hardcoding colors in Tailwind classes. Instead, it uses **CSS Variables** mapped in `tailwind.config.js`.
* **Definition:** Themes are defined as objects containing RGB values (e.g., `primary: '79 70 229'`).
* **Application:** The `applyTheme` utility injects these values into `:root`.
* **Usage:** Tailwind classes use the variables: `bg-skin-card` resolves to `rgb(var(--color-card) / <alpha-value>)`. This allows instant theme switching without re-renders or context providers.

### 3. Milestone Generation (`utils/generators.ts`)
Calculations are heavy but memoized.
* **Strategy:** We generate milestones relative to a `baseDate`.
* **Categorization:** Milestones are tagged with Enums (`Power`, `Repdigit`, `Sequence`) to allow easy filtering in the UI.
* **Performance:** The generation logic runs inside `useMemo` hooks to prevent recalculation on UI interactions like opening modals.

### 4. Persistence
* **Storage:** User profile, theme preference, and custom events are persisted in `localStorage`.
* **Hydration:** State initializes via lazy initializers `useState(() => ...)` to read storage only once on mount.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone [https://github.com/yNeer/Life-milestone-calculator-.git](https://github.com/yNeer/Life-milestone-calculator-.git)
   cd Life-milestone-calculator-

 * Install dependencies
   npm install

 * Run Development Server
   npm run dev

 * Build for Production
   npm run build


## 📂 Project Structure

```text
src/
├── components/          # React Components
│   ├── ShareModal.tsx   # Video/Image Export Logic
│   ├── Visualizations/  # Charts & Graphs
│   ├── MosaicWidgets/   # Dashboard Tiles
│   └── ...
├── utils/
│   ├── generators.ts    # Math logic for milestones
│   ├── themes.ts        # Theme definitions & injector
│   └── calendar.ts      # ICS/Google Calendar helpers
├── types.ts             # TypeScript Interfaces
├── App.tsx              # Main Router/Layout
└── main.tsx             # Entry point
```

## 🎨 Theming Guide
To add a new theme, navigate to src/utils/themes.ts:
export const themes: Record<ThemeId, Theme> = {
  // ... existing themes
  ```code
  myNewTheme: {
    id: 'myNewTheme',
    name: 'My Custom Theme',
    colors: {
      base: '30 30 30',       // Background RGB
      card: '45 45 45',       // Card RGB
      text: '255 255 255',    // Text RGB
      primary: '255 0 0',     // Accent RGB
      // ...
    }
  }
};
```


Note: Colors must be space-separated RGB values to support Tailwind's opacity modifiers.
🤝 Contributing
Contributions are welcome!
 * Fork the Project.
 * Create your Feature Branch (git checkout -b feature/AmazingFeature).
 * Commit your Changes (git commit -m 'Add some AmazingFeature').
 * Push to the Branch (git push origin feature/AmazingFeature).
 * Open a Pull Request.
📄 License
Distributed under the MIT License. See LICENSE for more information.
<p align="center">
Built with ❤️ using React & Math
