import { weatherSymbolKeys, CONTACT_EMAIL } from './types.js';

const USER_AGENT = `YrWeatherExtension/2.0 ${CONTACT_EMAIL}`;

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("weatherUpdate", { periodInMinutes: 15 });
});
chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create("weatherUpdate", { periodInMinutes: 15 });
});
chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
    if (alarm.name === "weatherUpdate") updateToolbarWeather();
});

// Listen for weather data from popup
chrome.runtime.onMessage.addListener((message: { type: string; symbolCode?: string; temperature?: number; lat?: number; lon?: number; altitude?: number }) => {
    if (message.type === 'UPDATE_TOOLBAR' && message.symbolCode && message.temperature !== undefined) {
        const fileName = (weatherSymbolKeys as Record<string, string>)[message.symbolCode] || message.symbolCode;
        const iconPath = `icons/${fileName}.png`;
        updateToolbarIcon(iconPath, message.temperature);

        // Save location so background can fetch independently
        if (message.lat !== undefined && message.lon !== undefined) {
            chrome.storage.local.set({
                lastSymbolCode: message.symbolCode,
                lastTemperature: message.temperature,
                lastLat: message.lat,
                lastLon: message.lon,
                lastAltitude: message.altitude,
            });
        }
    }
});

async function updateToolbarWeather() {
    try {
        const stored = await chrome.storage.local.get(['lastLat', 'lastLon', 'lastAltitude']) as { lastLat?: number; lastLon?: number; lastAltitude?: number };
        if (!stored.lastLat || !stored.lastLon) {
            console.warn('No saved location for background update');
            return;
        }

        let url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${stored.lastLat.toFixed(4)}&lon=${stored.lastLon.toFixed(4)}`;
        if (stored.lastAltitude !== undefined) {
            url += `&altitude=${stored.lastAltitude}`;
        }
        const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT }
        });
        const data = await res.json() as any;

        const temp = Math.round(data.properties.timeseries[0].data.instant.details.air_temperature);
        const symbolCode = data.properties.timeseries[0].data.next_1_hours?.summary.symbol_code;

        if (symbolCode) {
            const fileName = (weatherSymbolKeys as Record<string, string>)[symbolCode] || symbolCode;
            const iconPath = `icons/${fileName}.png`;
            await updateToolbarIcon(iconPath, temp);

            // Update cached values
            chrome.storage.local.set({
                lastSymbolCode: symbolCode,
                lastTemperature: temp,
            });
        }
    } catch (err) {
        console.error("Background weather update failed", err);
    }
}

async function updateToolbarIcon(iconPath: string, temperature: number) {
    try {
        const canvas = new OffscreenCanvas(128, 128);
        const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        if (!ctx) return;

        const response = await fetch(chrome.runtime.getURL(iconPath));
        const blob = await response.blob();
        const imgBitmap = await createImageBitmap(blob);

        ctx.clearRect(0, 0, 128, 128);
        ctx.drawImage(imgBitmap, 0, 0, 128, 128);

        ctx.fillStyle = "#00FFFF";
        ctx.font = "bold 80px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";

        ctx.strokeStyle = "#1A1A1B";
        ctx.lineWidth = 8;

        const x = 110;
        const y = 75;

        ctx.strokeText(`${temperature}°`, x, y);
        ctx.fillText(`${temperature}°`, x, y);

        const imageData = ctx.getImageData(0, 0, 128, 128);

        await chrome.action.setIcon({
            imageData: { "128": imageData }
        });

        await chrome.action.setBadgeText({ text: "" });
    } catch (err) {
        console.error("Icon update failed", err);
    }
}
