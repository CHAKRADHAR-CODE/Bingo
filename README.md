# BINGO PRIME - Universal Cross-Platform Game Application

A production-grade, high-performance **Universal Cross-Platform Bingo Application** supporting **Web**, **Windows Desktop (Electron)**, **Android Mobile (Capacitor)**, and **iOS Mobile (Capacitor)** using a single unified React 19 + TypeScript codebase.

---

## 🚀 Key Platform Features

### 🖥️ Windows Desktop Application (Electron)
- **Native Custom Title Bar**: Window minimize, maximize, fullscreen, close controls, and drag regions.
- **Standalone Windows Executable**: Configured `electron-builder` to package `.exe` installers and portable executables into `release/`.
- **System Tray & Keyboard Shortcuts**: Native desktop window controls and background persistence.

### 📱 Android & iOS Applications (Capacitor)
- **Native Haptic Feedback Engine**: Tactile vibration responses on tile marking, powerup triggers, and victory fanfares (`@capacitor/haptics`).
- **Glassmorphic Mobile Bottom Navigation**: Touch-optimized bottom navigation bar for seamless mobile UX.
- **Offline & Network Status Monitor**: Real-time network detection displaying an offline alert when disconnected (`@capacitor/network`).
- **Native Notifications**: Local/push notifications for line completions and room invites (`@capacitor/local-notifications`).
- **Native Status Bar & Splash Screen**: Dark theme status bar and animated splash screen configuration.

### 🎨 Visuals & Audio Engine
- **Canvas Particle Engine**: Dynamic Starfield warp, neon particle backdrop, and victory fireworks.
- **Web Audio API Synthesizer**: Pure Web Audio SFX generation for clicks, stamps, line completions, and victory fanfares without external audio asset downloads.
- **Speech Synthesis Announcer**: Audibly speaks draw numbers aloud (*"B-12"*, *"I-24"*).
- **5 Custom Visual Themes**: Cyberpunk 2077, Royal Platinum, Retro Synthwave, Emerald Matrix, Deep Void.

---

## 📁 Directory Structure

```
Bingo/
├── android/                   # Native Android Studio project (Capacitor)
├── ios/                       # Native Xcode project (Capacitor)
├── dist/                      # Vite compiled production web assets
├── release/                   # Windows Desktop (.exe / .msi) installer builds
├── electron.cjs               # Electron main desktop process script
├── capacitor.config.ts        # Capacitor mobile app configuration
├── server.ts                  # Express + Socket.IO real-time backend server
├── src/
│   ├── components/
│   │   ├── DesktopHeader.tsx  # Native window header titlebar
│   │   ├── MobileBottomNav.tsx# Mobile glassmorphic navigation bar
│   │   ├── OfflineBanner.tsx  # Offline network status indicator
│   │   ├── IntroScreen.tsx    # Cinematic intro splash screen
│   │   ├── GameLauncher.tsx   # Main Menu Hub (Solo AI, Arcade, Multiplayer, Achievements)
│   │   ├── ArcadePowerups.tsx # Tactical power-up actions
│   │   ├── AchievementsModal.tsx
│   │   ├── SettingsModal.tsx  # Theme & audio customizer
│   │   └── ParticleCanvas.tsx # Canvas 2D particle engine
│   ├── services/
│   │   ├── nativeService.ts   # Unified native bridge (Haptics, Notifications, Network)
│   │   ├── soundEngine.ts     # Web Audio API Synthesizer & Speech Announcer
│   │   ├── particleEngine.ts  # Canvas particle renderer
│   │   └── aiBot.ts           # Offline AI bot opponent engine
│   ├── App.tsx                # Main application orchestrator
│   └── types.ts               # Shared TypeScript interface definitions
├── package.json
└── start-app.bat              # Windows double-clickable launcher
```

---

## 🛠️ Build & Development Commands

### 1. Run Development Web & Socket Server
```bash
npm run dev
```

### 2. Launch Windows Desktop Application (Electron)
```bash
npm run app
```
*(Or double-click `start-app.bat`)*

### 3. Package Windows (.exe) Installer
```bash
npm run build:desktop
```
> The generated `.exe` installer will be saved to `release/`.

### 4. Build Mobile Production Assets (Capacitor)
```bash
npm run build:mobile
```

### 5. Open Android Studio to Build (.apk / .aab)
```bash
npx cap add android
npm run cap:android
```
> Build APK/AAB inside Android Studio via **Build > Build Bundle(s) / APK(s) > Build APK**.

### 6. Open Xcode to Build iOS (.ipa)
```bash
npx cap add ios
npm run cap:ios
```
> Archive & export `.ipa` inside Xcode via **Product > Archive**.

---

## 📄 License
MIT License - Bingo Prime Universal Edition.
