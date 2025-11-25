import { NextResponse } from 'next/server';

// Simple in-memory cache and rate limit (server-side)
type WeatherCacheData = {
    city: string;
    country: string;
    current: {
        temp: number;
        feels_like: number;
        humidity: number;
        wind_speed: number;
        description: string;
        icon: string;
        dt: number;
    };
    hourly: Array<{
        dt: number;
        temp: number;
        icon: string;
        description: string;
        pop: number;
    }>;
    daily: Array<{
        dt: number;
        temp_min: number;
        temp_max: number;
        icon: string;
        description: string;
        pop: number;
    }>;
};

const weatherCache = new Map<string, { ts: number; data: WeatherCacheData }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT = 120; // requests per IP per minute
const ipMap = new Map<string, number[]>();

function getClientIp(req: Request) {
    try {
        // In serverless or behind proxies this might not be correct; for demo use this.
        const url = new URL(req.url);
        return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || url.hostname || 'unknown';
    } catch {
        return 'unknown';
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    if (!lat || !lon) return NextResponse.json({ error: 'lat/lon required' }, { status: 400 });

    const cacheKey = `${parseFloat(lat).toFixed(3)}_${parseFloat(lon).toFixed(3)}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return NextResponse.json(cached.data);
    }

    // basic per-IP rate limit
    try {
        const ip = getClientIp(req);
        const now = Date.now();
        const arr = ipMap.get(ip) || [];
        const filtered = arr.filter((t) => now - t < RATE_WINDOW_MS);
        if (filtered.length >= RATE_LIMIT) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }
        filtered.push(now);
        ipMap.set(ip, filtered);
    } catch { }

    const API_KEY = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';
    if (!API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`),
        ]);

        if (!currentRes.ok || !forecastRes.ok) return NextResponse.json({ error: 'OpenWeather error' }, { status: 502 });

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        // Map to same structure used in client lib
        const current = {
            temp: Math.round(currentData.main.temp),
            feels_like: Math.round(currentData.main.feels_like),
            humidity: currentData.main.humidity,
            wind_speed: Math.round(currentData.wind.speed * 3.6),
            description: currentData.weather[0].description,
            icon: currentData.weather[0].icon,
            dt: currentData.dt,
        };

        interface ForecastItem { dt: number; main: { temp: number }; weather: { icon: string; description: string }[]; pop?: number }
        const hourly = forecastData.list.slice(0, 8).map((item: ForecastItem) => ({
            dt: item.dt,
            temp: Math.round(item.main.temp),
            icon: item.weather[0].icon,
            description: item.weather[0].description,
            pop: Math.round((item.pop || 0) * 100),
        }));
        const dailyMap = new Map<string, ForecastItem[]>();
        forecastData.list.forEach((item: ForecastItem) => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!dailyMap.has(date)) dailyMap.set(date, []);
            dailyMap.get(date)!.push(item);
        });

        const daily = Array.from(dailyMap.entries()).slice(0, 5).map((entry) => {
            const items = entry[1];
            const temps = items.map((i: ForecastItem) => i.main.temp);
            const middayItem = items.find((i: ForecastItem) => {
                const hour = new Date(i.dt * 1000).getHours();
                return hour >= 11 && hour <= 14;
            }) || items[0];

            return {
                dt: items[0].dt,
                temp_min: Math.round(Math.min(...temps)),
                temp_max: Math.round(Math.max(...temps)),
                icon: middayItem.weather[0].icon,
                description: middayItem.weather[0].description,
                pop: Math.round(Math.max(...items.map((i: ForecastItem) => i.pop || 0)) * 100),
            };
        });

        const result = {
            city: currentData.name,
            country: currentData.sys.country,
            current,
            hourly,
            daily,
        };

        weatherCache.set(cacheKey, { ts: Date.now(), data: result });

        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: 'Fetch error' }, { status: 500 });
    }
}
