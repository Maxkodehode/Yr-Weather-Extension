import { Welcome, weatherSymbolKeys } from './types.js';

async function getBergenWeather(): Promise<Welcome> {
    const url = "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=60.39&lon=5.32";

    const res = await fetch(url, {
        headers: { 'User-Agent': 'MyBraveExtension/1.0 (my@email.com)' }
    });

    if (!res.ok) throw new Error("Weather fetch failed");
    
    return (await res.json()) as Welcome;
}

async function initExtension() {
    try {
        const weather = await getBergenWeather();

        const instantDetails = weather.properties.timeseries[0].data.instant.details;
        const temp = Math.round(instantDetails.air_temperature);
        const wind = instantDetails.wind_speed;
        const symbolCode = weather.properties.timeseries[0].data.next_1_hours?.summary.symbol_code;
        
        document.getElementById('temp')!.innerText = `${temp}°C`;
        document.getElementById('wind')!.innerText = `${wind}`;

        if (symbolCode) {
            document.getElementById('description')!.innerText = symbolCode.replace(/_/g, ' ');
            
            const iconImg = document.getElementById('weather-icon') as HTMLImageElement;
            
            const fileName = weatherSymbolKeys[symbolCode] || symbolCode;
            iconImg.src = `icons/${fileName}.png`;
        }
    } catch (err) {
        console.error("Popup setup failed:", err);
    }
}

initExtension();