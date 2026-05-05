# DailyOps Bot

A sophisticated Electron-based desktop application for real-time daily operations tracking with adaptive UI modes, automated workflow orchestration, and comprehensive shift reporting.

## Overview

**DailyOps Bot** is a production-grade productivity tool designed for professionals managing complex, time-segmented workflows. It combines the predictability of scheduled blocks with the flexibility of custom task management, all wrapped in a performant, non-intrusive desktop widget architecture.

### Key Capabilities

- **Intelligent Schedule Engine**: Real-time phase tracking with automatic progression, countdown timers, and progress visualization
- **Dual-Mode UI**: Full-featured dashboard for active planning, frameless chat-head bubble for passive monitoring
- **Custom Task Management**: Timestamped task lists with checkbox-based completion tracking and flexible scheduling
- **Automated Notifications**: OS-native alerts synchronized with custom audio cues (Web Audio API with volume amplification)
- **Shift Reporting**: Contextual export of daily activities, focus areas, task completion, and session notes

## System Requirements

- **OS**: macOS 10.13+ or Windows 10+
- **Node.js**: v14.0 or higher
- **Memory**: Minimal footprint (~80MB runtime)
- **Architecture**: x64 (arm64 support pending)

## Installation

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd daily-ops-bot

# Install dependencies
npm install

# Launch development environment
npm start
```

### Production Build

```bash
# Package application for distribution
npm run build

# Output artifacts
./dist/DailyOps\ Bot-*.dmg        # macOS
./dist/DailyOps\ Bot\ Setup.exe   # Windows
```

## Project Structure

```
daily-ops-bot/
├── main.js                 # Electron main process (IPC handlers, window lifecycle)
├── renderer.js            # Frontend logic (schedule engine, task state, exports)
├── index.html             # UI structure (views: setup, tracker, editor, bubble)
├── styles.css             # Styling (glassmorphism, draggable regions, animations)
├── package.json           # Dependencies & scripts
└── resources/
    ├── logo.png           # App icon (used in header & bubble widget)
    └── Chinese Meme Ringtone Download.mp3  # Alarm audio asset
```

## Usage Guide

### Initial Setup

1. **Launch Application**: Opens directly to the main menu (`Good Morning, Lej!`).
2. **Customize Focus**: Edit the "Today's Focus" textarea with your priority areas.
3. **Add Custom Tasks**: 
   - Provide optional start/end times
   - Enter task description
   - Click the `+` button to add to your checklist
4. **Review/Edit Schedule**: Click the "Review/Edit Schedule" button to modify the default 7-phase timeline.

### Active Tracking Mode

1. **Start My Day**: Initiates the tracker with real-time countdown and live progress bar.
2. **Monitor Progress**: View current phase, estimated completion time, and timeline breakdown.
3. **Task Completion**: Check off custom tasks as they're completed (state persists during session).
4. **End-of-Shift Documentation**: Log reflections, blockers, and notes in the "End Shift Notes" textarea.
5. **Export Report**: Generate a timestamped `.txt` file containing full shift summary.

### Minimized Mode (Bubble Widget)

- **Minimize**: Click the `-` button to collapse the app into a 70px draggable bubble.
- **Drag**: Grab any edge of the bubble to reposition on-screen (native OS drag).
- **Expand**: Click the center of the bubble to restore full window.
- **Notifications**: Badge displays unseen phase transitions while minimized.

## Architecture

### Core Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Electron 13+ | Cross-platform desktop execution |
| **Frontend** | HTML5 / CSS3 / Vanilla JS | Zero-dependency UI layer |
| **Audio** | Web Audio API | Programmatic volume amplification |
| **IPC** | `ipcMain` / `ipcRenderer` | Main ↔ Renderer process communication |
| **Styling** | CSS Variables | Dynamic theme adaptation |

### Window Configuration

```javascript
{
  width: 380, height: 600,          // Default dimensions
  frame: false,                      // Frameless for custom styling
  transparent: true,                 // Supports glassmorphism
  alwaysOnTop: true,                 // Persistent visibility
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false
  }
}
```

### State Management

- **Schedule Array**: Immutable during active tracking; editable in review mode
- **Custom Ops**: In-memory array persisting across view transitions (lost on app restart)
- **Timestamps**: ISO-formatted for consistency; converted to 12-hour display format
- **Notifications**: Badge count incremented per phase transition; cleared on window focus

### CSS Draggable Regions

Strategic use of `-webkit-app-region` enables simultaneous smooth dragging and precise click interactions:

```css
#bubble-view {
  -webkit-app-region: drag;          /* Entire background draggable */
}

.hit-area {
  -webkit-app-region: no-drag;       /* 30x30px center carved out for click events */
}
```

## Features in Detail

### Real-Time Countdown

- Updates every 1000ms via `setInterval()`
- Formatted as `HH:MM:SS`
- Detects weekend/off-hours and displays contextual messaging
- Automatically transitions to next scheduled phase

### Audio Notification System

```javascript
const audioCtx = new AudioContext();
const gainNode = audioCtx.createGain();
gainNode.gain.value = 2.0;  // 200% volume amplification
// Routes through Web Audio graph for processing
```

### Export Pipeline

Generated `.txt` reports include:

```
DAILY OPS SHIFT REPORT - 5/5/2026
====================================================

TODAY'S FOCUS:
[User-defined priorities]

CUSTOM TASKS & CHECKLIST:
[X] (2:00 PM - 3:00 PM) Task Description
[ ] (4:00 PM) Another Task

MAIN SCHEDULE RUN:
- 8:00 AM - 9:30 AM: OLY Morning Operations
[... full timeline ...]

END SHIFT NOTES:
[User reflections]
```

## Configuration

### Default Schedule

The application ships with a pre-configured 7-phase weekday schedule (Monday–Friday):

| Time | Phase | Description |
|------|-------|-------------|
| 08:00–09:30 | OLY Morning | Client communication & ticket review |
| 09:30–10:00 | Breakfast | Recharge |
| 10:00–12:00 | PDFScanAccess Work | R&D, features, marketing |
| 12:00–13:30 | Lunch & Rest | Midday break |
| 13:30–17:00 | Main Operations | OLY + PDFScanAccess combined push |
| 17:00–19:00 | Dinner + Research | Cefiro preparation |
| 19:30–23:30 | Cefiro Growth | Deep work on strategic growth |

Edit these via the **Review/Edit Schedule** interface.

## Development

### Scripts

```bash
npm start           # Launch dev environment with hot-reload
npm run build       # Generate installers (dmg/exe)
npm run dist        # Create packaged artifacts only
npm run pack        # Test packaging without signing
```

### Debugging

- **DevTools**: Press `Ctrl+Shift+I` (Windows) or `Cmd+Option+I` (macOS) during development
- **Console Logging**: All renderer process logs appear in DevTools console
- **IPC Tracing**: Add `console.log()` in `ipcMain.handle()` blocks in `main.js`

### Performance Considerations

- **Memory**: In-memory task array (no persistence layer); consider localStorage/IndexedDB for multi-session support
- **Rendering**: CSS animations optimized for 60fps; no heavy re-renders during countdown
- **Audio**: Web Audio API runs on separate thread; no UI blocking during playback

## Troubleshooting

| Issue | Resolution |
|-------|-----------|
| **Audio not playing** | Ensure `resources/Chinese Meme Ringtone Download.mp3` exists; check browser autoplay policy |
| **Drag not working** | Verify `-webkit-app-region` CSS is applied; clear cache and restart |
| **Notifications not showing** | Check OS notification settings; grant DailyOps Bot permission in System Preferences |
| **Export file not found** | Check Downloads folder; filename format: `Shift_Report_YYYY-MM-DD.txt` |

## Future Roadmap

- [ ] **Persistence**: LocalStorage or SQLite for cross-session task retention
- [ ] **Cloud Sync**: Optional Notion/Airtable integration for team visibility
- [ ] **Keyboard Shortcuts**: Global hotkeys for quick minimization and phase skipping
- [ ] **Analytics**: Weekly/monthly productivity dashboards
- [ ] **Multi-Day Schedules**: Support for custom day configurations beyond the default 7-phase block

## Contributing

This project is maintained as a personal productivity tool. Pull requests for bug fixes and performance improvements are welcome; feature proposals should be discussed in issues first.

## License

MIT © 2026

---

**Author**: Built for sustainable daily operations management.  
**Last Updated**: May 5, 2026
