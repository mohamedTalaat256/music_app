# Music Player Application

A production-grade, full-featured music player application built with Angular 22, featuring advanced audio processing, playlist management, and a modern UI.

## Features

### 🎵 Core Playback
- **Play, Pause, Stop** - Complete playback control
- **Seek/Progress** - Jump to any position in a song
- **Previous/Next** - Navigate through playlists
- **Repeat Modes** - Off, repeat one, repeat all
- **Shuffle** - Randomize playlist order
- **Volume Control** - Precise volume adjustment with mute

### 📚 Library Management
- **Import Audio Files** - Multiple format support (MP3, WAV, OGG, AAC, FLAC, M4A)
- **Metadata Extraction** - Automatic title, artist, album, genre detection
- **Album Artwork** - Display embedded artwork from files
- **Drag & Drop** - Easy file import interface
- **Favorites** - Mark songs as favorites for quick access
- **Search** - Instant search by title, artist, album, or genre

### 📋 Playlists
- **Create Playlists** - Organize music into custom collections
- **Manage Songs** - Add/remove songs from playlists
- **Reorder** - Rearrange playlist order
- **Playlist Info** - View song count and total duration
- **Quick Play** - Play entire playlists or individual songs

### 🎛️ Audio Effects
- **Equalizer** - 6-band parametric EQ with presets
  - 60Hz, 170Hz, 350Hz, 1kHz, 3.5kHz, 10kHz
  - Range: -12dB to +12dB
  - Presets: Flat, Bass Boost, Treble Boost, Vocal Boost
- **Reverb** - Spatial audio effect
  - Wet/Dry Mix control
  - Decay time adjustment
  - Pre-delay control
  - Room size parameter
  - Presets: Small Room, Medium Room, Large Hall, Cathedral, Studio
- **Bass Boost** - Low-frequency enhancement
  - 0-100% intensity
  - Visual percentage display

### 🎨 User Interface
- **Modern Design** - Material 3 design system
- **Light/Dark Theme** - System preference detection
- **Responsive Layout** - Works on desktop and mobile
- **Glassmorphism** - Modern visual effects
- **Smooth Animations** - Polished transitions
- **Tab Navigation** - Organized feature sections

### 💾 Data Persistence
- **IndexedDB Storage** - Dexie database integration
- **Auto-Save** - Settings and playlists saved automatically
- **Offline Support** - Full functionality without internet
- **Data Export/Import** - Backup and restore library

### ⚙️ Advanced Features
- **Metadata Reading** - music-metadata-browser integration
- **Tone.js Audio Engine** - Professional audio processing
- **AudioMotion Analyzer** - Waveform visualization ready
- **UUID Generation** - Unique song/playlist IDs
- **RxJS Integration** - Reactive programming patterns

## Architecture

### Folder Structure
```
src/app/
├── core/
│   ├── models/          # Data models and interfaces
│   └── services/        # Core business logic
│
├── shared/
│   ├── models/          # Shared data types
│   ├── pipes/           # Custom Angular pipes
│   ├── directives/      # Custom directives
│   └── utils/           # Helper functions
│
├── features/
│   ├── library/         # Music library management
│   ├── player/          # Playback controls
│   ├── playlists/       # Playlist management
│   ├── search/          # Search functionality
│   └── settings/        # Application settings
│
└── app.config.ts        # Application configuration
```

### Key Services

#### AudioEngineService
- Manages Tone.js audio graph
- Controls playback (play, pause, seek)
- Handles audio effects (EQ, reverb, bass boost)
- Monitors playback position

#### StorageService
- IndexedDB operations via Dexie
- CRUD operations for songs and playlists
- Settings persistence
- Data export/import

#### PlayerStoreService
- Manages player state using Angular Signals
- Tracks current song, playback state, queue
- Coordinates UI updates
- Handles repeat and shuffle modes

#### LibraryService
- Manages music library
- Performs searching and filtering
- Handles favorites
- Integrates with storage

#### PlaylistService
- Playlist CRUD operations
- Song management in playlists
- Playlist selection
- Duration calculations

#### FileImportService
- File selection dialog
- Metadata extraction
- Audio file validation
- Object URL generation

#### MetadataService
- Uses music-metadata-browser
- Extracts audio metadata
- Handles artwork extraction
- File validation

#### SettingsService
- Application settings management
- Theme switching
- Audio effects state
- Auto-save preferences

## Technology Stack

- **Framework**: Angular 22 (Standalone Components)
- **UI**: Angular Material 22, Material 3 Theme
- **Audio**: Tone.js 15, AudioMotion Analyzer 4
- **Metadata**: music-metadata-browser 2.5
- **Storage**: Dexie 4 (IndexedDB)
- **Utilities**: RxJS 7.8, UUID 14
- **Styling**: SCSS with CSS Variables
- **State Management**: Angular Signals

## Installation

### Prerequisites
- Node.js 18+
- npm 9+

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build
```

## Usage

### Importing Music
1. Navigate to the **Library** tab
2. Click **Import Music**
3. Select audio files (multi-select supported)
4. Metadata will be extracted automatically
5. Songs appear in your library

### Playing Music
1. Browse or search for songs in the Library
2. Click on a song to load it
3. Use playback controls to play/pause
4. Use Previous/Next to navigate
5. Adjust volume with the slider

### Creating Playlists
1. Navigate to the **Playlists** tab
2. Click **New Playlist**
3. Enter a name
4. Click on songs to add them
5. Playlists auto-save

### Adjusting Audio
1. Go to the **Effects** tab
2. Toggle effects on/off
3. Adjust sliders in real-time
4. Use presets for quick configurations
5. Changes apply immediately

### Switching Themes
1. Navigate to **Settings** tab
2. Select Light, Dark, or Auto theme
3. Auto-detect uses system preference
4. Theme saves automatically

## Best Practices

### Performance
- OnPush change detection enabled
- Virtual scrolling for large libraries
- Efficient signal-based state management
- Lazy loading support ready

### Code Quality
- TypeScript strict mode
- Standalone components only
- Pure functions for state
- Proper error handling

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast compatibility
- Focus management

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Format Support

- MP3 (MPEG-1 Layer III)
- WAV (Waveform Audio)
- OGG (Ogg Vorbis)
- AAC (Advanced Audio Codec)
- FLAC (Free Lossless Audio Codec)
- M4A (MPEG-4 Audio)

## Storage Limits

- IndexedDB: Browser dependent (typically 50MB+)
- File size: Up to 500MB per file
- Library capacity: 5000+ songs

## Keyboard Shortcuts

- **Space**: Play/Pause
- **→**: Next track
- **←**: Previous track
- **↑/↓**: Volume control
- **Escape**: Close dialogs

## Troubleshooting

### Audio Not Playing
- Check file format support
- Verify browser permissions
- Try a different audio file
- Check browser console for errors

### Metadata Not Extracting
- File may lack embedded metadata
- Try re-importing file
- Manual metadata entry coming soon

### Performance Issues
- Clear IndexedDB if corrupted
- Reload page
- Check browser memory usage

## Development

### Adding New Features
1. Create component in appropriate feature folder
2. Use Angular 22 signals for state
3. Follow OnPush change detection
4. Add proper error handling
5. Update tests

### Code Style
- Use TypeScript strict mode
- Avoid `any` types
- Follow Angular style guide
- Use meaningful variable names
- Add JSDoc comments

## License

MIT

## Changelog

### Version 1.0.0
- Initial release
- Complete playback control
- Library management
- Playlist system
- Audio effects
- Theme switching
- Full offline support

## Future Roadmap

- [ ] Visualizer integration (AudioMotion Analyzer)
- [ ] Equalizer presets management
- [ ] Queue management UI
- [ ] Recently played list
- [ ] Statistics and analytics
- [ ] Export playlists (M3U, XSPF)
- [ ] Keyboard shortcuts guide
- [ ] Accessibility improvements
- [ ] Mobile app version
- [ ] Cloud sync (optional)

## Support

For issues and feature requests, please check the project repository.

## Credits

Built with modern Angular patterns and best practices.
