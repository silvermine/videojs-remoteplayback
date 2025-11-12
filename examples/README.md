# Test Examples

This directory contains interactive test pages for the Video.js Remote Playback plugin.

## Usage

Start the development server:

```bash
npm run dev:build
```

Then browse to `http://localhost:3000` to access the test pages.

## Test Pages

### Main Index (`/`)

Overview page with links to all test examples and usage instructions.

### AirPlay Test (`/airplay.html`)

   * **Purpose**: Test AirPlay functionality
   * **Browser**: Safari (macOS/iOS)
   * **Requirements**: AirPlay-compatible devices on the same network
   * **Expected**: AirPlay button appears in Video.js control bar

### Chromecast Test (`/chromecast.html`)

   * **Purpose**: Test Chromecast functionality  
   * **Browser**: Chrome
   * **Requirements**: Chromecast devices on the same network
   * **Expected**: Chromecast button appears in Video.js control bar

### Remote Playback API Test (`/remote-playback.html`)

   * **Purpose**: Test generic Remote Playback API across browsers
   * **Browser**: Any (shows different behavior per browser)
   * **Expected**: Shows browser compatibility and API availability info

## Development Notes

   * All test pages use CDN versions of Video.js for simplicity
   * Plugin assets are served from the `/dist/` directory via Vite's `publicDir`
   * Console logging provides detailed debugging information
   * Real-time status updates help track plugin behavior
