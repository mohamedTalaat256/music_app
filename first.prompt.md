You are a Senior Angular Architect and Full-Stack Frontend Engineer.

Your task is to build a production-grade Music Player Application using Angular 22 standalone architecture and modern Angular best practices.

==================================================
PROJECT OVERVIEW
==================================================

Create a modern, responsive, desktop and mobile-friendly music player application.

The application must allow users to:

1. App will load all audio files puplic/songs folder or in a settings screen user select a folder path to save
2. Import multiple audio files at once.
3. Read and display song metadata.
4. Create and manage playlists.
5. Search songs instantly.
6. Play, pause, stop, seek, next, previous.
7. Shuffle playlists.
8. Repeat single song or playlist.
9. Adjust volume.
10. View album artwork.
11. Apply audio effects.
12. Switch between light and dark themes.
13. Persist playlists and settings locally.

This is a client-side application only.

No backend is required.

==================================================
TECH STACK
==================================================

Angular 22 Standalone APIs
Angular Material
Angular CDK
NgRx
Tone.js
music-metadata-browser
Dexie
AudioMotion Analyzer
Lucide Angular
RxJS
TypeScript
PWA (Progressive Web App)

Already Installed:

@angular/material
@angular/cdk
@ngrx/store
@ngrx/effects
@ngrx/entity
@ngrx/store-devtools
@angular/pwa
tone
music-metadata-browser
dexie
uuid
audiomotion-analyzer
@lucide/angular

==================================================
ARCHITECTURE REQUIREMENTS
==================================================

Follow Clean Architecture principles.

Use:

public
|---songs
|---css
|   |--- bootstrap-grid.min.css
|   |--- spacing.css
src/app
│
├── core
│   ├── services
│   ├── guards
│   ├── interceptors
│   └── store
│
├── shared
│   ├── models
│   ├── pipes
│   ├── directives
│   ├── utils
│   └── ui
│
├── features
│   │
│   ├── player
│   │
│   ├── library
│   │
│   ├── playlists
│   │
│   ├── search
│   │
│   └── settings
│
└── app.config.ts

Use standalone components only.

No NgModules.

Use OnPush change detection everywhere.

Use Signals where appropriate.

Use strongly typed interfaces.

Use lazy-loaded feature routes.

Avoid any anti-patterns.

Use Angular PWA to make the app installable as a PWA.

Use public/css/bootstrap-grid.min.css for responsive grid layouts.

Use public/css/spacing.css for bootstrap spacing.

==================================================
STATE MANAGEMENT
==================================================

Use NgRx.

Create feature stores for:

PlayerState
LibraryState
PlaylistState
SettingsState

State should include:

Current song
Playback state
Position
Duration
Volume
Shuffle
Repeat mode
Theme
Effects configuration
Library songs
Playlists

Use selectors.

Use actions.

Use effects where necessary.

==================================================
FILE IMPORT FEATURE
==================================================

Create a library management system.

User should be able to:

- Click "Import Music"
- Select multiple files
- Drag and drop files
- Import entire batches

Supported formats:

mp3
wav
ogg
aac
flac
m4a

When imported:

1. Read metadata using music-metadata-browser
2. Extract:
   - title
   - artist
   - album
   - genre
   - year
   - duration
   - artwork

3. Generate object URLs
4. Save metadata in IndexedDB using Dexie

Do NOT upload files anywhere.

Everything remains local.

==================================================
SONG MODEL
==================================================

Create a normalized Song interface.

Example fields:

id
title
artist
album
genre
year
duration
artwork
fileName
fileType
fileSize
url
addedDate

==================================================
PLAYER FEATURE
==================================================

Build an advanced audio player.

Capabilities:

Play
Pause
Stop
Seek
Next
Previous
Shuffle
Repeat One
Repeat All

Display:

Album art
Song title
Artist
Elapsed time
Remaining time
Waveform/Spectrum

Responsive layout.

==================================================
AUDIO ENGINE
==================================================

Use Tone.js.

Create AudioEngineService.

Create a complete audio graph:

Audio Source
↓
Equalizer
↓
Bass Boost
↓
Reverb
↓
Master Gain
↓
Audio Destination

The AudioEngineService should expose:

loadTrack()
play()
pause()
stop()
seek()
setVolume()

==================================================
EQUALIZER FEATURE
==================================================

Create a full equalizer.

Bands:

60Hz
170Hz
350Hz
1kHz
3.5kHz
10kHz

Range:

-12dB to +12dB

Use Tone.EQ3 or individual filters.

Provide modern sliders.

Display values live.

==================================================
REVERB FEATURE
==================================================

This is a major requirement.

Create a dedicated Reverb panel.

User should control:

Wet/Dry Mix
Decay
Pre-delay
Room Size

Provide presets:

Small Room
Medium Room
Large Hall
Cathedral
Studio

Allow real-time adjustment while music is playing.

Use Tone.Reverb.

Changes must be audible immediately.

==================================================
BASS BOOST FEATURE
==================================================

Create bass enhancement controls.

Options:

Enable/Disable Bass Boost

Control amount:

0%
25%
50%
75%
100%

Use a low shelf filter.

==================================================
VISUALIZER FEATURE
==================================================

Use AudioMotion Analyzer.

Create spectrum visualization.

Modes:

Bars
Mirror Bars
Waveform

Support:

Theme awareness
Resize awareness
High FPS rendering

==================================================
PLAYLIST FEATURE
==================================================

Users must be able to:

Create playlist
Rename playlist
Delete playlist
Add songs
Remove songs
Reorder songs

Support:

Drag and drop using Angular CDK

Persist playlists via Dexie.

==================================================
SEARCH FEATURE
==================================================

Provide instant search.

Search by:

Title
Artist
Album
Genre

Use RxJS debouncing.

Search results should update immediately.

==================================================
THEMING
==================================================

Support:

Light Theme
Dark Theme

Requirements:

Material 3

Theme switcher

Remember user preference.

Auto detect system preference.

Store preference in IndexedDB.

==================================================
LOCAL STORAGE
==================================================

Use Dexie IndexedDB.

Save:

Songs metadata
Playlists
User settings
Theme
Audio effect presets

Create centralized StorageService.

==================================================
UI REQUIREMENTS
==================================================

Design style:

Modern music streaming application

Inspired by:

Spotify
Apple Music
YouTube Music

Characteristics:

Material 3
Glassmorphism
Smooth animations
Rounded corners
Modern typography
Responsive layouts

Desktop:
Sidebar + Main Player

Mobile:
Bottom Player + Drawer Navigation

==================================================
ACCESSIBILITY
==================================================

Support:

Keyboard navigation
ARIA labels
High contrast compatibility
Focus indicators

==================================================
PERFORMANCE
==================================================

Requirements:

Lazy loading
OnPush
Signals
TrackBy functions
Virtual scrolling for large libraries
Efficient rendering

Able to handle:

5000+ songs

==================================================
DELIVERABLES
==================================================

Generate code incrementally.

Begin with:

1. Folder structure
2. Models
3. State management
4. Storage layer
5. Audio engine
6. Library import feature
7. Player UI
8. Audio effects
9. Playlists
10. Search
11. Theme system

For every file:

- Show filename.
- Explain its responsibility.
- Provide complete code.
- Follow Angular 22 best practices.
- Use TypeScript strict mode.
- Avoid placeholder implementations.

The final result should be production-ready and scalable.
