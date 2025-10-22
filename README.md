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

## Build Process

The plugin includes a comprehensive build process that handles both code and assets:

### Building the Plugin

```bash
npm run build
```

This command:

1. **Compiles TypeScript**: Builds the source code using Vite
2. **Generates Bundles**: Creates both UMD and ESM versions
3. **Copies Assets**: Automatically copies icons from `src/images/` to `dist/images/`

## License

This software is released under the MIT license. See [the license file](LICENSE) for
more details.
