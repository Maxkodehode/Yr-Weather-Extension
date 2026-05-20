# Yr Weather Extension

A Chromium browser extension that shows current weather and a 6-hour forecast for your location, powered by [yr.no](https://yr.no) (the Norwegian Meteorological Institute).

## Features

- **Current conditions** -- temperature, wind speed, humidity, cloud cover, and precipitation
- **6-hour hourly forecast** -- temperature, weather icon, and precipitation for each hour
- **Location by GPS** -- uses browser geolocation with accuracy refinement (samples over time for best fix)
- **Reverse geocoding** -- displays a human-readable location name (neighborhood, city) via OpenStreetMap Nominatim
- **Location caching** -- caches your location for 30 minutes so the popup opens instantly
- **Toolbar icon overlay** -- draws the current temperature on the extension icon, updated every 15 minutes via a background service worker
- **Accuracy indicator** -- color-coded badge showing GPS accuracy (green < 50m, yellow < 200m, red >= 200m)

---

## Quick Start (Setup Script)

The easiest way to get started. The script will install dependencies, ask for your email (required by the weather API), compile the code, and give you instructions for your browser.

### Linux

Open a terminal in the project folder and run:

```bash
bash setup.sh
```

### macOS

Open Terminal in the project folder and run:

```bash
bash setup.sh
```

### Windows

Double-click `setup_win.bat` in the project folder.

---

## Manual Setup

If you prefer to set things up yourself, follow these steps.

### 1. Install Node.js

You need Node.js to compile the TypeScript code. Check if you have it:

```bash
node --version
```

If it is not installed:

- **Linux:** Use your package manager (`apt`, `dnf`, `pacman`, etc.) or install [nvm](https://github.com/nvm-sh/nvm)
- **macOS:** `brew install node` or install [nvm](https://github.com/nvm-sh/nvm)
- **Windows:** Install from [nodejs.org](https://nodejs.org/en/download/) or use `winget install OpenJS.NodeJS.LTS`

### 2. Set Your Contact Email

The weather APIs require a contact email in the User-Agent header. Open `WeatherApp/types.ts` and change this line:

```typescript
export const CONTACT_EMAIL = 'you@example.com';
```

Replace `you@example.com` with your own email. For example:

```typescript
export const CONTACT_EMAIL = 'alice@protonmail.com';
```

That is all the "registration" needed. There is no account to create or sign-up page to visit. The email in the User-Agent header is how the API operators identify you. See the [MET Norway terms](https://api.met.no/doc/TermsOfService) and [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) for details.

### 3. Install Dependencies

```bash
npm install
```

### 4. Compile TypeScript

```bash
npx tsc
```

This produces `popup.js`, `background.js`, and `types.js` inside `WeatherApp/`.

### 5. Load the Extension in Your Browser

This extension works with any Chromium-based browser:

| Browser | Extensions URL | Developer mode toggle |
|---------|---------------|----------------------|
| Google Chrome | `chrome://extensions` | Top-right |
| Brave | `brave://extensions` | Top-right |
| Microsoft Edge | `edge://extensions` | Bottom-left |
| Opera | `opera://extensions` | Top-right |
| Vivaldi | `vivaldi://extensions` | Top-left |

Steps are the same for all of them:

1. Navigate to the extensions URL for your browser
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `WeatherApp/` directory
5. The Yr Weather icon should appear in your toolbar

### 6. Reload After Changes

After editing `.ts` files:

```bash
npx tsc
```

Then click the refresh icon on the extension card in your browser's extensions page.

---

## APIs Used

| API | Purpose | URL |
|-----|---------|-----|
| MET Norway Locationforecast 2.0 Compact | Weather data | `https://api.met.no/weatherapi/locationforecast/2.0/compact` |
| Nominatim (OpenStreetMap) | Reverse geocoding | `https://nominatim.openstreetmap.org/reverse` |

## Project Structure

```
Yr-Weather-Extension/
  setup.sh                  # Setup launcher for Linux/macOS
  setup_win.bat             # Setup launcher for Windows (double-click)
  scripts/
    setup_linux.sh          # Linux setup
    setup_mac.sh            # macOS setup
    setup_win.ps1           # Windows setup
  WeatherApp/
    manifest.json           # Extension manifest (Manifest V3)
    popup.html              # Popup UI
    popup.ts                # Popup logic (location, weather fetch, rendering)
    popup.js                # Compiled popup.ts
    background.ts           # Background service worker (15-min icon updates)
    background.js           # Compiled background.ts
    types.ts                # TypeScript interfaces + CONTACT_EMAIL constant
    styles.css              # Popup styles (dark theme)
    icons/                  # Weather symbol icons (PNG)
  package.json              # Dev dependencies (@types/chrome, typescript)
  tsconfig.json             # TypeScript config
  README.md                 # This file
```

## Permissions

| Permission | Reason |
|------------|--------|
| `alarms` | Schedule 15-minute background weather updates |
| `geolocation` | Get the user's current position |
| `storage` | Persist last known location for background updates |
| `host_permissions: api.met.no` | Fetch weather data from MET Norway |
| `host_permissions: nominatim.openstreetmap.org` | Reverse geocode coordinates to a location name |

## License

This project uses free and open APIs:

- Weather data from [MET Norway](https://api.met.no/) (CC BY 4.0)
- Geolocation from [OpenStreetMap Nominatim](https://nominatim.org/) (ODbL)
