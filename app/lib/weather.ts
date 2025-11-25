// Tipos para la API de OpenWeather
export interface City {
    name: string;
    lat: number;
    lon: number;
    country: string;
    state?: string;
}

export interface CurrentWeather {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    description: string;
    icon: string;
    dt: number;
}

export interface HourlyForecast {
    dt: number;
    temp: number;
    icon: string;
    description: string;
    pop: number; // Probabilidad de precipitación
}

export interface DailyForecast {
    dt: number;
    temp_min: number;
    temp_max: number;
    icon: string;
    description: string;
    pop: number;
}

export interface WeatherData {
    city: string;
    country: string;
    current: CurrentWeather;
    hourly: HourlyForecast[];
    daily: DailyForecast[];
}

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';

// Buscar ciudades por nombre (Geocoding API)
export async function searchCities(query: string): Promise<City[]> {
    if (!query || query.length < 2) return [];

    // cache in sessionStorage for 1 hour to avoid repeated requests
    try {
        if (typeof window !== 'undefined') {
            const key = `ow_search_${query.toLowerCase()}`;
            const raw = sessionStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.ts < 1000 * 60 * 60) {
                    return parsed.data as City[];
                }
            }
        }
    } catch {
        // ignore cache errors
    }

    try {
        const res = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
        );
        if (!res.ok) return [];
        const data = await res.json();
        interface GeocodingApiItem {
            name: string;
            lat: number;
            lon: number;
            country: string;
            state?: string;
        }
        const mapped = data.map((item: GeocodingApiItem) => ({
            name: item.name,
            lat: item.lat,
            lon: item.lon,
            country: item.country,
            state: item.state,
        }));

        try {
            if (typeof window !== 'undefined') {
                const key = `ow_search_${query.toLowerCase()}`;
                sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: mapped }));
            }
        } catch {
            // ignore
        }

        return mapped;
    } catch {
        return [];
    }
}

// Obtener clima actual y pronóstico (One Call API 3.0 o fallback a 2.5)
export async function getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
    try {
        // simple client-side rate limiting to avoid excessive calls from this client
        if (typeof window !== 'undefined') {
            try {
                const rlKey = 'ow_rate_v1';
                const raw = sessionStorage.getItem(rlKey);
                const now = Date.now();
                const windowMs = 60 * 1000; // 1 minute window
                const limit = 60; // max requests per minute per client
                let arr: number[] = raw ? JSON.parse(raw) : [];
                arr = arr.filter((t) => now - t < windowMs);
                if (arr.length >= limit) {
                    // too many requests from this client recently
                    return null;
                }
                arr.push(now);
                sessionStorage.setItem(rlKey, JSON.stringify(arr));
            } catch { }
        }

        // Try server-side proxy endpoints to avoid exposing API key to client.
        // Use internal API routes we created at /api/geocode and /api/weather
        const base = '';
        const weatherRes = await fetch(`${base}/api/weather?lat=${lat}&lon=${lon}`);
        if (!weatherRes.ok) return null;
        const weatherJson = await weatherRes.json();

        // If the proxy returned an error object, handle it
        if (weatherJson && weatherJson.error) return null;

        // The server proxy returns the final shape already (current, hourly, daily)
        return {
            city: weatherJson.city,
            country: weatherJson.country,
            current: weatherJson.current,
            hourly: weatherJson.hourly,
            daily: weatherJson.daily,
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

// Obtener icono de OpenWeather
export function getWeatherIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

// Formatear fecha
export function formatDate(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', options);
}

// Formatear hora
export function formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Nombre del día
export function getDayName(timestamp: number): string {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[new Date(timestamp * 1000).getDay()];
}
