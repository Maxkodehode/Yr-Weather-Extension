import { weatherSymbolKeys, CONTACT_EMAIL } from './types.js';
const USER_AGENT = `YrWeatherExtension/2.0 ${CONTACT_EMAIL}`;
// --- Storage keys ---
const STORAGE_KEY_WEATHER = 'yr_weather_data'; // full current weather snapshot
// --- Alarm period: 10 minutes ---
const UPDATE_PERIOD_MINUTES = 10;
// --- Extension lifecycle ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('weatherUpdate', { periodInMinutes: UPDATE_PERIOD_MINUTES });
    // Fetch immediately on install
    fetchAndStoreWeather();
});
chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create('weatherUpdate', { periodInMinutes: UPDATE_PERIOD_MINUTES });
});
// --- Alarm: periodic weather update ---
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'weatherUpdate') {
        fetchAndStoreWeather();
    }
});
// --- Message handling ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SET_LOCATION') {
        // Popup tells background about the current location (from geolocation or manual override)
        chrome.storage.local.set({
            lastLat: message.lat,
            lastLon: message.lon,
            lastAltitude: message.altitude,
            locationName: message.locationName,
        });
        return; // no response needed
    }
    if (message.type === 'GET_WEATHER') {
        // Popup (or any consumer) requesting latest weather data
        getStoredWeather().then((data) => {
            if (data) {
                sendResponse({ type: 'WEATHER_DATA', data });
            }
            else {
                // No data yet — fetch now
                fetchAndStoreWeather().then(() => {
                    getStoredWeather().then((fresh) => {
                        sendResponse({ type: 'WEATHER_DATA', data: fresh });
                    });
                });
            }
        }).catch(() => {
            sendResponse({ type: 'WEATHER_ERROR', error: 'Failed to get weather' });
        });
        return true; // keep message channel open for async response
    }
    if (message.type === 'REFRESH_WEATHER') {
        // Force a fresh fetch (e.g., user clicked refresh in popup)
        fetchAndStoreWeather().then(() => {
            getStoredWeather().then((data) => {
                sendResponse({ type: 'WEATHER_DATA', data });
            });
        }).catch(() => {
            sendResponse({ type: 'WEATHER_ERROR', error: 'Failed to refresh weather' });
        });
        return true; // async
    }
    if (message.type === 'UPDATE_TOOLBAR' && message.symbolCode && message.temperature !== undefined) {
        // Legacy path: popup sends weather data after a manual fetch
        // Still accepted but the primary flow is background-driven
        void handlePopupToolbarUpdate({
            symbolCode: message.symbolCode,
            temperature: message.temperature,
            lat: message.lat,
            lon: message.lon,
            altitude: message.altitude,
        });
    }
});
// --- Core: fetch weather from MET API and store in chrome.storage.local ---
async function fetchAndStoreWeather() {
    try {
        const stored = await chrome.storage.local.get(['lastLat', 'lastLon', 'lastAltitude', 'locationName']);
        const lat = stored.lastLat;
        const lon = stored.lastLon;
        const altitude = stored.lastAltitude;
        const storedName = stored.locationName;
        if (lat === undefined || lon === undefined) {
            console.warn('No saved location — cannot fetch weather');
            return;
        }
        const weather = await fetchWeatherFromAPI(lat, lon, altitude);
        const instant = weather.properties.timeseries[0].data.instant.details;
        const temp = Math.round(instant.air_temperature);
        const symbolCode = weather.properties.timeseries[0].data.next_1_hours?.summary.symbol_code;
        const wind = instant.wind_speed;
        const windDirection = instant.wind_from_direction;
        const clouds = instant.cloud_area_fraction;
        const humidity = instant.relative_humidity;
        const dewPoint = calculateDewPoint(instant.air_temperature, humidity);
        const dewPointDepression = temp - dewPoint;
        const precip = weather.properties.timeseries[0].data.next_1_hours?.details.precipitation_amount ?? 0;
        // Build hourly forecast (next 6 entries)
        const hourly = weather.properties.timeseries.slice(0, 6).map((entry) => ({
            time: entry.time,
            temp: Math.round(entry.data.instant.details.air_temperature),
            symbolCode: entry.data.next_1_hours?.summary.symbol_code,
            precip: entry.data.next_1_hours?.details.precipitation_amount ?? 0,
        }));
        const fileName = symbolCode ? (weatherSymbolKeys[symbolCode] || symbolCode) : '01d';
        const iconPath = `icons/${fileName}.png`;
        const storedWeather = {
            temp,
            symbolCode,
            wind,
            windDirection,
            clouds,
            humidity,
            dewPointDepression,
            precip,
            iconPath,
            locationName: storedName || 'Unknown',
            fetchedAt: Date.now(),
            hourly,
        };
        await chrome.storage.local.set({
            [STORAGE_KEY_WEATHER]: storedWeather,
            lastSymbolCode: symbolCode,
            lastTemperature: temp,
        });
        // Update toolbar icon
        await updateToolbarIcon(iconPath, temp);
        await chrome.action.setBadgeText({ text: '' });
        console.log(`[Background] Weather updated: ${temp}°C at ${new Date().toLocaleTimeString()}`);
    }
    catch (err) {
        console.error('Background weather update failed', err);
    }
}
// --- Fetch weather from MET API ---
async function fetchWeatherFromAPI(lat, lon, altitude) {
    let url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
    if (altitude !== undefined) {
        url += `&altitude=${altitude}`;
    }
    const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
    });
    if (!res.ok)
        throw new Error('Weather fetch failed');
    return await res.json();
}
// --- Read stored weather data ---
async function getStoredWeather() {
    const data = await chrome.storage.local.get([STORAGE_KEY_WEATHER]);
    return data[STORAGE_KEY_WEATHER] || null;
}
// --- Handle legacy popup toolbar update ---
async function handlePopupToolbarUpdate(message) {
    const fileName = weatherSymbolKeys[message.symbolCode] || message.symbolCode;
    const iconPath = `icons/${fileName}.png`;
    await updateToolbarIcon(iconPath, message.temperature);
    // Save location so background can fetch independently
    if (message.lat !== undefined && message.lon !== undefined) {
        await chrome.storage.local.set({
            lastSymbolCode: message.symbolCode,
            lastTemperature: message.temperature,
            lastLat: message.lat,
            lastLon: message.lon,
            lastAltitude: message.altitude,
        });
    }
}
// --- Update toolbar icon with temperature overlay ---
async function updateToolbarIcon(iconPath, temperature) {
    try {
        const canvas = new OffscreenCanvas(128, 128);
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const response = await fetch(chrome.runtime.getURL(iconPath));
        const blob = await response.blob();
        const imgBitmap = await createImageBitmap(blob);
        ctx.clearRect(0, 0, 128, 128);
        ctx.drawImage(imgBitmap, 0, 0, 128, 128);
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.strokeStyle = '#1A1A1B';
        ctx.lineWidth = 8;
        const x = 110;
        const y = 75;
        ctx.strokeText(`${temperature}°`, x, y);
        ctx.fillText(`${temperature}°`, x, y);
        const imageData = ctx.getImageData(0, 0, 128, 128);
        await chrome.action.setIcon({
            imageData: { '128': imageData }
        });
        await chrome.action.setBadgeText({ text: '' });
    }
    catch (err) {
        console.error('Icon update failed', err);
    }
}
// --- Dew point calculation (Magnus formula) ---
function calculateDewPoint(tempC, rh) {
    const a = 17.625;
    const b = 243.04;
    const alpha = (a * tempC) / (b + tempC) + Math.log(rh / 100);
    return (b * alpha) / (a - alpha);
}
