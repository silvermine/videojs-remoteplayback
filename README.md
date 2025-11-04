# videojs-remoteplayback

## What

A Video.js plugin that enables remote playback capabilities for casting video content to
Chromecast and AirPlay devices.

## Why

Modern users expect seamless video experiences across all their devices. Whether they're
watching on a laptop and want to cast to their TV via Chromecast, or streaming from an
iPhone to an Apple TV using AirPlay, remote playback has become an essential feature for
video applications.

While Video.js provides excellent video playback capabilities, it lacks built-in support
for casting to external devices. This plugin bridges that gap by:

   * **Enhancing User Experience**: Allows users to easily cast videos to their preferred
     viewing devices
   * **Cross-Platform Compatibility**: Supports both Google's Chromecast and Apple's
     AirPlay ecosystems
   * **Developer Convenience**: Provides a simple, unified API for implementing casting
     functionality
   * **Future-Proofing**: Built with modern web standards and TypeScript for
     maintainability

## Development

### Building the Plugin

```bash
npm run build
```

This command:

1. **Compiles TypeScript**: Builds the source code using Vite
2. **Generates Bundles**: Creates both UMD and ESM versions
3. **Copies Assets**: Automatically copies icons from `src/images/` to `dist/images/`

### Development Server

For interactive testing during development, use the built-in dev server:

```bash
# Build the plugin and start the dev server
npm run dev:build

# Or start the dev server separately (requires pre-built plugin)
npm run build
npm run dev
```

The dev server provides:

   * **Interactive Test Pages**: Browse to `http://localhost:3000` for test examples
   * **Live Testing**: Test AirPlay, Chromecast, and Remote Playback API functionality
   * **Browser-Specific Tests**: Separate pages for testing different casting technologies
   * **Real-time Debugging**: Console logging and status updates for development

#### Available Test Pages

   * **`/`** - Main examples index with links to all test pages
   * **`/airplay.html`** - AirPlay functionality testing (Safari/Apple devices)
   * **`/chromecast.html`** - Chromecast functionality testing (Chrome browser)
   * **`/remote-playback.html`** - Generic Remote Playback API testing (cross-browser)

### Running Tests

```bash
# Run unit tests
npm test

# Run linting and standards checks
npm run standards
```

## License

This software is released under the MIT license. See [the license file](LICENSE) for
more details.
