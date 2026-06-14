# Project: Yr Weather Extension

## Description
Browser extension (Chrome/Brave, Manifest V3) that shows current weather and 6-hour
forecast using the MET Norway API (yr.no). Uses geolocation + reverse geocoding via
Nominatim.

## Goal
Replace the "Humidity" display in the popup with "Dew Point" temperature.

The MET Norway API already provides `dew_point_temperature` in the instant details.
We just need to:
1. Add `dew_point_temperature` to the TypeScript types
2. Read it instead of `relative_humidity` in `popup.ts`
3. Change the label in `popup.html` from "Humidity" to "Dew Point"

## Key Files
- `WeatherApp/popup.ts` — main logic, reads weather data, renders UI
- `WeatherApp/popup.html` — popup UI, has the details grid
- `WeatherApp/types.ts` — TypeScript interfaces for the MET Norway API response
- `WeatherApp/styles.css` — styles for the popup

## Tech Stack
- TypeScript compiled to JavaScript (tsc)
- No build system — raw tsc compilation
- Manifest V3 Chrome extension
