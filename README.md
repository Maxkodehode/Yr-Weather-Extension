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

## Screenshots

The popup is 380px wide with a dark theme, showing current conditions at the top and an hourly forecast below.

## APIs Used

| API | Purpose | URL |
|-----|---------|-----|
| MET Norway Locationforecast | Weather data | `https://api.met.no/weatherapi/locationforecast/2.0/compact` |
| Nominatim (OpenStreetMap) | Reverse geocoding | `https://nominatim.openstreetmap.org/reverse` |

### Important: Yr.no / MET Norway API User-Agent

MET Norway requires all requests to include a descriptive `User-Agent` header with a contact email. **The code currently contains the developer's personal email address.** Before using or distributing this extension, you **must** replace the email with your own.

Search for `maxkodehode@gmail.com` in the following files and replace it with your own email:

- `WeatherApp/popup.ts` (line 130)
- `WeatherApp/background.ts` (line 42)

Example replacement:

```typescript
// Before
headers: { 'User-Agent': 'YrWeatherExtension/2.0 (maxkodehode@gmail.com)' }

// After (use your own email)
headers: { 'User-Agent': 'YrWeatherExtension/2.0 (you@example.com)' }
```

Failing to set a proper User-Agent with a valid contact email violates the [MET Norway API terms of service](https://api.met.no/conditions_service.html) and may result in your requests being blocked.

## Project Structure

```
Yr-Weather-Extension/
  WeatherApp/
    manifest.json        -- Extension manifest (Manifest V3)
    popup.html           -- Popup UI
    popup.ts             -- Popup logic (location, weather fetch, rendering)
    popup.js             -- Compiled popup.js
    background.ts        -- Background service worker (15-min icon updates)
    background.js        -- Compiled background.js
    types.ts             -- TypeScript interfaces for API responses
    styles.css           -- Popup styles (dark theme)
    icons/               -- Weather symbol icons (PNG)
  package.json           -- Dev dependencies (@types/chrome)
  tsconfig.json          -- TypeScript config
```

## Development

### Prerequisites

- Node.js (for TypeScript compilation)
- A Chromium-based browser (Brave, Chrome, Edge, etc.)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Replace the email address in `WeatherApp/popup.ts` and `WeatherApp/background.ts` with your own (see section above).

3. Compile TypeScript:

   ```bash
   npx tsc
   ```

   Or with watch mode during development:

   ```bash
   npx tsc --watch
   ```

### Loading the Extension

1. Open your browser and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `WeatherApp/` directory
5. The extension icon should appear in your toolbar

### Making Changes

After editing `.ts` files, recompile with `npx tsc`, then click the refresh button on the extension card in `chrome://extensions` to reload.

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
