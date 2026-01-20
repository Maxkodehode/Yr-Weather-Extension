import { Welcome } from './types.js';
import { weatherSymbolKeys } from './types.js';

async function updateToolbarWeather() {
    const url = "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=60.39&lon=5.32";

    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'BergenWeather/1.0 (maxkodehode@gmail.com)' } });
        const data = (await res.json()) as Welcome;

        const temp = Math.round(data.properties.timeseries[0].data.instant.details.air_temperature);
        const symbolCode = data.properties.timeseries[0].data.next_1_hours?.summary.symbol_code;


        await chrome.action.setBadgeText({text: `${temp}°`});
        await chrome.action.setBadgeBackgroundColor({color: "#4682B4"});

        
        if (symbolCode) {
            
            const fileName = weatherSymbolKeys[symbolCode] || symbolCode;

            await chrome.action.setIcon({
                path: {
                    "16": `icons/${fileName}.png`,
                    "48": `icons/${fileName}.png`,
                    "128": `icons/${fileName}.png`
                }
            });
        }
    } catch (err) {
        console.error("Toolbar update failed", err);
    }
}

chrome.runtime.onInstalled.addListener(updateToolbarWeather);
chrome.runtime.onStartup.addListener(updateToolbarWeather);

chrome.alarms.create("weatherUpdate", { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
    if (alarm.name === "weatherUpdate") updateToolbarWeather();
});