# NewsNow Mobile App

React Native mobile application for NewsNow, built with Expo Router.

## Features

- 📱 Native iOS & Android support
- 🌐 Multi-language support (EN, ZH, FR, ES, DE)
- 🔄 Real-time news aggregation
- 🌍 Region-based filtering
- 🔖 Focus/favorite sources
- 🌐 Content translation support
- 📦 Shared business logic with web app

## Tech Stack

- **Framework**: React Native with Expo
- **Routing**: Expo Router
- **State Management**: Jotai
- **Data Fetching**: TanStack Query
- **Internationalization**: i18next
- **Storage**: AsyncStorage
- **Shared Code**: @newsnow/shared package

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

From the project root:

```bash
pnpm install
```

### Development

The mobile app relies on the web app's API server for data fetching. You must run both the web server and the mobile app.

1. **Start the API Server** (in a separate terminal):

   ```bash
   # From the project root
   pnpm dev:web
   ```

   This starts the server at `http://localhost:5173`.

2. **Start the Mobile App**:

   ```bash
   cd apps/mobile
   pnpm start
   ```

3. **Run on Emulator/Device**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code for physical device

### Environment Variables

Create a `.env` file in the `apps/mobile` directory:

```
EXPO_PUBLIC_API_URL=https://your-api-url.com/api
EXPO_PUBLIC_LIBRETRANSLATE_API=https://libretranslate.com
EXPO_PUBLIC_LIBRETRANSLATE_KEY=your-api-key
```

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen
│   └── c/
│       └── [column].tsx   # Column detail screen
├── src/
│   ├── atoms/             # Jotai state atoms
│   ├── hooks/             # Custom React hooks
│   ├── i18n/              # Internationalization
│   └── utils/             # Utility functions
├── assets/                # Images and static files
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Shared Code

The mobile app shares business logic with the web app through the `@newsnow/shared` package:

- News source definitions
- Type definitions
- Metadata management
- Utility functions

## Building

### iOS

```bash
# Create development build
eas build --platform ios --profile development

# Create production build
eas build --platform ios --profile production
```

### Android

```bash
# Create development build
eas build --platform android --profile development

# Create production build
eas build --platform android --profile production
```

## Contributing

See the main [CONTRIBUTING.md](../web/CONTRIBUTING.md) in the web app directory.

## License

See the main [LICENSE](../web/LICENSE) file.
