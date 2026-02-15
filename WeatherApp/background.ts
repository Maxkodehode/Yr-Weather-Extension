import { Welcome } from './types.js';
import { weatherSymbolKeys } from './types.js';

chrome.runtime.onInstalled.addListener(updateToolbarWeather);
chrome.runtime.onStartup.addListener(updateToolbarWeather);



chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
    if (alarm.name === "weatherUpdate") updateToolbarWeather();
});

async function updateToolbarWeather() {
    const url = "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=60.38&lon=5.33";



    try {
        const res = await fetch(url, {headers: {'User-Agent': 'BergenWeather/1.0 (maxkodehode@gmail.com)'}});
        const data = (await res.json()) as Welcome;

        const temp = Math.round(data.properties.timeseries[0].data.instant.details.air_temperature);
        const symbolCode = data.properties.timeseries[0].data.next_1_hours?.summary.symbol_code;

        if (symbolCode) await updateToolbar(symbolCode, temp);

        chrome.alarms.create("weatherUpdate", {periodInMinutes: 15});
    }
    catch (err) {
        console.error("Weather fetch failed", err);
    }

        //type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
        //const color: RGBA = 'rgba(255, 0, 0, 0)';

        //await chrome.action.setBadgeText({text: `${temp}°`});
        //await chrome.action.setBadgeBackgroundColor({color: [92, 92, 101, 128]}); // Transparent
        //await chrome.action.setBadgeTextColor({color: "#51F7D1"});


        /*if (symbolCode) {
            
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
    }*/
    }

async function updateToolbar(symbolCode: string, temperature: number) {
    try {
        const fileName = (weatherSymbolKeys as Record<string, string>)[symbolCode] || symbolCode;
        const iconPath = `icons/${fileName}.png`;

        // 1. Upgraded to 128px for high-definition drawing
        const canvas = new OffscreenCanvas(128, 128);
        const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

        if (!ctx) return;

        const response = await fetch(chrome.runtime.getURL(iconPath));
        const blob = await response.blob();
        const imgBitmap = await createImageBitmap(blob);

        ctx.clearRect(0, 0, 128, 128);

        // 2. Draw the weather icon slightly larger (filling more of the 128px space)
        // Adjust these numbers if you want the icon itself to be smaller/larger
        ctx.drawImage(imgBitmap, 0, 0, 128, 128);

        // 3. Much larger font (60px to 80px works well on a 128px canvas)
        ctx.fillStyle = "#00FFFF";
        ctx.font = "bold 80px Arial"; // BIGGER FONT
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";

        // 4. Add a thick outline to make the large text pop
        ctx.strokeStyle = "#1A1A1B";
        ctx.lineWidth = 8; // Thicker line for higher resolution

        // Using 135 to "nudge" it slightly off-canvas for that corner look
        const x = 110;
        const y = 75;

        ctx.strokeText(`${temperature}°`, x, y);
        ctx.fillText(`${temperature}°`, x, y);

        const imageData = ctx.getImageData(0, 0, 128, 128);

        // 5. Tell Chrome this is a 128px icon
        await chrome.action.setIcon({
            imageData: { "128": imageData }
        });

        await chrome.action.setBadgeText({ text: "" });

    } catch (err) {
        console.error("Icon update failed", err);
    }
}


    