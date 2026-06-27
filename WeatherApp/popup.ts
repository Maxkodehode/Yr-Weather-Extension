import { weatherSymbolKeys, NominatimResponse, CachedLocation, CONTACT_EMAIL, StoredWeather } from './types.js';

const USER_AGENT = `YrWeatherExtension/2.0 ${CONTACT_EMAIL}`;

const LOCATION_CACHE_KEY = 'yr_cached_location';
const LOCATION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// --- Known locations (snap-to stations) ---

interface KnownLocation {
    name: string;
    lat: number;
    lon: number;
    altitude: number; // meters above sea level
}

const KNOWN_LOCATIONS: KnownLocation[] = [
    { name: 'Bergen - Florida', lat: 60.3833, lon: 5.3333, altitude: 12 },
    { name: 'Bergen - Sentrum', lat: 60.3913, lon: 5.3221, altitude: 4 },
];

const SNAP_RADIUS_METERS = 2000; // snap if within 2 km of a known location

// Haversine distance in meters between two lat/lon points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Find the nearest known location within snap radius, or return null
function snapToKnownLocation(lat: number, lon: number): KnownLocation | null {
    let best: KnownLocation | null = null;
    let bestDist = SNAP_RADIUS_METERS;
    for (const loc of KNOWN_LOCATIONS) {
        const d = haversineDistance(lat, lon, loc.lat, loc.lon);
        if (d < bestDist) {
            bestDist = d;
            best = loc;
        }
    }
    return best;
}

function getCachedLocation(): CachedLocation | null {
    try {
        const raw = localStorage.getItem(LOCATION_CACHE_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw) as CachedLocation;
        if (Date.now() - cached.timestamp > LOCATION_CACHE_TTL) return null;
        return cached;
    } catch {
        return null;
    }
}

function cacheLocation(lat: number, lon: number, name: string, accuracy: number, altitude?: number) {
    const cached: CachedLocation = { lat, lon, name, timestamp: Date.now(), accuracy, altitude };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cached));
}

function displayAccuracy(accuracyMeters: number) {
    const el = document.getElementById('location-accuracy')!;
    const rounded = Math.round(accuracyMeters);
    el.textContent = `±${rounded}m`;

    el.classList.remove('good', 'medium', 'poor');
    if (rounded < 50) {
        el.classList.add('good');
    } else if (rounded < 200) {
        el.classList.add('medium');
    } else {
        el.classList.add('poor');
    }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    });
}

// Sample geolocation over a period and return the most accurate reading
function refinePosition(sampleIntervalMs: number = 3000, maxDurationMs: number = 30000): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        let bestPosition: GeolocationPosition | null = null;
        let settled = false;

        const settle = () => {
            if (settled) return;
            settled = true;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            if (bestPosition) {
                resolve(bestPosition);
            } else {
                reject(new Error('Geolocation failed — no position received'));
            }
        };

        // Stop sampling after maxDuration and use best result so far
        const timeoutId = setTimeout(settle, maxDurationMs);

        // Sample repeatedly at the given interval
        const intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
                        bestPosition = pos;
                    }
                    // If we got a very accurate reading (< 20m), settle early
                    if (pos.coords.accuracy < 20) {
                        settle();
                    }
                },
                () => {
                    // Ignore individual sample failures; keep trying
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }, sampleIntervalMs);

        // Take the first sample immediately
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                bestPosition = pos;
                if (pos.coords.accuracy < 20) {
                    settle();
                }
            },
            () => {
                // Ignore; interval will retry
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
    });
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json() as NominatimResponse;

    const addr = data.address;
    // Pick the most specific neighborhood/suburb name
    const neighborhood = addr.neighbourhood || addr.suburb || addr.village || '';
    const city = addr.city || addr.town || addr.municipality || addr.county || '';

    if (neighborhood && city) return `${neighborhood}, ${city}`;
    if (city) return city;
    if (neighborhood) return neighborhood;
    return data.display_name.split(',').slice(0, 2).join(',');
}

// --- Weather helpers ---

function getWeatherIconUrl(symbolCode: string | undefined): string {
    if (!symbolCode) return 'icons/01d.png';
    const fileName = (weatherSymbolKeys as Record<string, string>)[symbolCode] || symbolCode;
    return `icons/${fileName}.png`;
}

function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// --- UI rendering ---

function compassDirection(degrees: number): string {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return dirs[index];
}

function renderCurrentFromStorage(data: StoredWeather) {
    const descEl = document.getElementById('description')!;
    const tempEl = document.getElementById('temp')!;
    const windEl = document.getElementById('wind')!;
    const dewPointEl = document.getElementById('dew-point')!;
    const cloudsEl = document.getElementById('clouds')!;
    const precipEl = document.getElementById('precip')!;
    const iconImg = document.getElementById('weather-icon') as HTMLImageElement;
    const locEl = document.getElementById('location-name')!;

    locEl.textContent = data.locationName;
    tempEl.textContent = `${data.temp}°C`;
    windEl.textContent = `${compassDirection(data.windDirection)} ${data.wind} m/s`;
    dewPointEl.textContent = `${data.dewPoint.toFixed(1)}°`;
    cloudsEl.textContent = `${data.clouds}%`;
    precipEl.textContent = `${data.precip.toFixed(1)} mm`;

    if (data.symbolCode) {
        descEl.textContent = data.symbolCode.replace(/_/g, ' ');
        iconImg.src = getWeatherIconUrl(data.symbolCode);
    }

    renderHourlyFromStored(data.hourly);
}

function renderHourlyFromStored(hourly: StoredWeather['hourly']) {
    const container = document.getElementById('hourly-forecast')!;
    container.innerHTML = '';

    hourly.forEach(entry => {
        const time = formatTime(entry.time);
        const temp = entry.temp;
        const symbolCode = entry.symbolCode;
        const precip = entry.precip;

        const row = document.createElement('div');
        row.className = 'hourly-row';

        const iconUrl = getWeatherIconUrl(symbolCode);

        row.innerHTML = `
            <span class="hourly-time">${time}</span>
            <img class="hourly-icon" src="${iconUrl}" alt="" width="28" height="28">
            <span class="hourly-temp">${temp}°</span>
            ${precip > 0 ? `<span class="hourly-precip">${precip.toFixed(1)}</span>` : '<span class="hourly-precip">&nbsp;</span>'}
        `;
        container.appendChild(row);
    });
}

function showError(msg: string) {
    const container = document.querySelector('.container')!;
    container.innerHTML = `<div class="error-msg">${msg}</div>`;
}

function setLoading(loading: boolean) {
    const loader = document.getElementById('loading');
    if (loader) loader.style.display = loading ? 'block' : 'none';
}

// --- Manual location override ---

const MANUAL_LOCATION_KEY = 'yr_manual_location';

function getManualLocation(): KnownLocation | null {
    const val = localStorage.getItem(MANUAL_LOCATION_KEY);
    if (!val || val === 'auto') return null;
    const found = KNOWN_LOCATIONS.find(l => l.name.toLowerCase().includes(val));
    return found || null;
}

function setManualLocation(key: string) {
    localStorage.setItem(MANUAL_LOCATION_KEY, key);
}

// --- Geo debug display ---

function showGeoDebug(pos: GeolocationPosition | null, snapped: KnownLocation | null, manual: boolean) {
    const el = document.getElementById('geo-debug');
    if (!el) return;
    el.style.display = 'block';

    if (manual) {
        el.textContent = `Manual: ${snapped?.name || 'unknown'} | API: ${snapped?.lat}, ${snapped?.lon} alt=${snapped?.altitude}m`;
        return;
    }

    if (!pos) {
        el.textContent = 'Geolocation failed';
        return;
    }

    const rawLat = pos.coords.latitude.toFixed(4);
    const rawLon = pos.coords.longitude.toFixed(4);
    const acc = Math.round(pos.coords.accuracy);
    const snappedName = snapped ? snapped.name : 'none (using raw)';
    el.textContent = `Raw: ${rawLat}, ${rawLon} ±${acc}m → Snapped: ${snappedName}`;
}

// --- Communication with background ---

function requestWeatherFromBackground(): Promise<StoredWeather | null> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_WEATHER' }, (response) => {
            if (response?.type === 'WEATHER_DATA' && response.data) {
                resolve(response.data as StoredWeather);
            } else {
                resolve(null);
            }
        });
    });
}

function refreshWeatherInBackground(): Promise<StoredWeather | null> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'REFRESH_WEATHER' }, (response) => {
            if (response?.type === 'WEATHER_DATA' && response.data) {
                resolve(response.data as StoredWeather);
            } else {
                resolve(null);
            }
        });
    });
}

// --- Main initialization ---

async function initExtension() {
    setLoading(true);

    try {
        // Step 1: Try to get weather data from background (stored in chrome.storage.local)
        const stored = await requestWeatherFromBackground();

        if (stored) {
            // Background has weather data — render immediately (always matches toolbar icon)
            renderCurrentFromStorage(stored);
            setLoading(false);
        }

        // Step 2: Determine location and get fresh data if needed
        const manualLocation = getManualLocation();
        if (manualLocation) {
            // Manual location set — tell background to use this location
            await chrome.runtime.sendMessage({
                type: 'SET_LOCATION',
                lat: manualLocation.lat,
                lon: manualLocation.lon,
                altitude: manualLocation.altitude,
                locationName: manualLocation.name,
            });
            const fresh = await refreshWeatherInBackground();
            if (fresh) {
                renderCurrentFromStorage(fresh);
            } else if (!stored) {
                // Fallback: render from cached location
                const cached = getCachedLocation();
                if (cached) {
                    renderCachedLocation(cached);
                }
            }
            showGeoDebug(null, manualLocation, true);
            return;
        }

        // Step 3: Auto location — sample position, tell background, refresh
        try {
            const pos = await refinePosition();
            const rawLat = pos.coords.latitude;
            const rawLon = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;

            const snapped = snapToKnownLocation(rawLat, rawLon);
            const lat = snapped ? snapped.lat : rawLat;
            const lon = snapped ? snapped.lon : rawLon;
            const altitude = snapped ? snapped.altitude : undefined;

            let locationName = snapped ? snapped.name : 'Current Location';
            if (!snapped) {
                try {
                    locationName = await reverseGeocode(lat, lon);
                } catch (e) {
                    console.warn('Geocoding failed, using fallback name');
                }
            }

            // Tell background about the location so it can fetch weather
            await chrome.runtime.sendMessage({
                type: 'SET_LOCATION',
                lat,
                lon,
                altitude,
                locationName,
            });

            // Refresh weather data via background
            const fresh = await refreshWeatherInBackground();
            if (fresh) {
                renderCurrentFromStorage(fresh);
                cacheLocation(lat, lon, locationName, accuracy, altitude);
                displayAccuracy(accuracy);
            } else if (stored) {
                // Already rendered from stored data above
                cacheLocation(lat, lon, locationName, accuracy, altitude);
                displayAccuracy(accuracy);
            } else {
                // No stored data and refresh failed — try cached
                const cached = getCachedLocation();
                if (cached) {
                    renderCachedLocation(cached);
                } else {
                    showError('Failed to load weather data');
                }
            }

            showGeoDebug(pos, snapped, false);
        } catch (err) {
            console.error('Geolocation failed:', err);

            // Fallback: try cached location
            const cached = getCachedLocation();
            if (cached) {
                renderCachedLocation(cached);
            } else if (!stored) {
                showError('Location access denied. Please enable location permissions and click refresh.');
            }
            // If stored was already rendered, we're fine
        }
    } finally {
        setLoading(false);
    }
}

// Fallback: render from cached location using stored weather data
function renderCachedLocation(cached: CachedLocation) {
    // We don't have the full weather data from cache — show what we can
    const locEl = document.getElementById('location-name')!;
    locEl.textContent = cached.name + ' (cached)';
    // The temperature/icon will be stale, but at least we show the location name
}

// Refresh button — delegate to background
document.getElementById('refresh-btn')!.addEventListener('click', async () => {
    setLoading(true);
    try {
        const fresh = await refreshWeatherInBackground();
        if (fresh) {
            renderCurrentFromStorage(fresh);
        } else {
            showError('Failed to refresh weather data');
        }
    } finally {
        setLoading(false);
    }
});

// Location selector change
document.getElementById('location-select')!.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    setManualLocation(val);
    if (val === 'auto') {
        localStorage.removeItem(MANUAL_LOCATION_KEY);
        localStorage.removeItem(LOCATION_CACHE_KEY);
    }
    initExtension();
});

// Set initial dropdown value from saved preference
const saved = localStorage.getItem(MANUAL_LOCATION_KEY);
if (saved && saved !== 'auto') {
    const sel = document.getElementById('location-select') as HTMLSelectElement;
    const match = KNOWN_LOCATIONS.find(l => l.name.toLowerCase().includes(saved));
    if (match) sel.value = saved;
}

initExtension();
