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

## APIs Used

| API | Purpose | URL |
|-----|---------|-----|
| MET Norway Locationforecast 2.0 Compact | Weather data | `https://api.met.no/weatherapi/locationforecast/2.0/compact` |
| Nominatim (OpenStreetMap) | Reverse geocoding | `https://nominatim.openstreetmap.org/reverse` |

## Setting Up Your API User-Agent

Both MET Norway and OpenStreetMap Nominatim require all API requests to include a `User-Agent` header with a valid contact email. This is not optional -- it is a condition of use for both services.

### Step 1: Choose an email address

Use an email address you control. It does not need to be publicly visible, but it must be valid so the API operators can contact you if your usage causes problems.

### Step 2: Register with MET Norway

1. Visit [https://api.met.no/](https://api.met.no/)
2. Read the terms of service at [https://api.met.no/conditions_service.html](https://api.met.no/conditions_service.html)
3. No account or API key is required -- the User-Agent header with your email **is** your identification
4. That is it. MET Norway uses the User-Agent to identify and throttle abusive clients. As long as you include a proper User-Agent, you are good to go

### Step 3: Register with Nominatim (OpenStreetMap)

1. Visit [https://nominatim.org/](https://nominatim.org/)
2. Read the usage policy at [https://operations.osmfoundation.org/policies/nominatim/](https://operations.osmfoundation.org/policies/nominatim/)
3. For light usage (single user, low request volume like this extension), no account is required -- the User-Agent header is sufficient
4. If you plan to distribute the extension widely or make heavy use, consider setting up your own Nominatim instance or creating an account

### Step 4: Set your email in the code

There is exactly **one place** to set your email: `WeatherApp/types.ts`, at the top of the file:

```typescript
export const USER_AGENT = 'YrWeatherExtension/2.0 (<your-email@example.com>)';
```

Replace `<your-email@example.com>` with your actual email. For example:

```typescript
export const USER_AGENT = 'YrWeatherExtension/2.0 (alice@protonmail.com)';
```

This constant is imported by both `popup.ts` and `background.ts`, so all API requests (weather data and geocoding) will use it automatically.

After editing, recompile with `npx tsc` (see Development section below).

## Project Structure

```
Yr-Weather-Extension/
  WeatherApp/
    manifest.json        -- Extension manifest (Manifest V3)
    popup.html           -- Popup UI
    popup.ts             -- Popup logic (location, weather fetch, rendering)
    popup.js             -- Compiled popup.ts
    background.ts        -- Background service worker (15-min icon updates)
    background.js        -- Compiled background.ts
    types.ts             -- TypeScript interfaces + USER_AGENT constant
    styles.css           -- Popup styles (dark theme)
    icons/               -- Weather symbol icons (PNG)
  package.json           -- Dev dependencies (@types/chrome, typescript)
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

2. **Set your email** in `WeatherApp/types.ts` (see "Setting Up Your API User-Agent" above).

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
