import { NextResponse } from 'next/server';

// Geocode result type
interface GeocodeResult {
    name: string;
    lat: number;
    lon: number;
    country: string;
    state?: string;
}

// Simple in-memory cache for geocode results (server-side)
const geocodeCache = new Map<string, { ts: number; data: GeocodeResult[] }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    if (!q || q.length < 2) return NextResponse.json([], { status: 200 });

    const key = q.toLowerCase();
    const cached = geocodeCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return NextResponse.json(cached.data);
    }

    const API_KEY = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';
    if (!API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    try {
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`);
        if (!res.ok) return NextResponse.json([], { status: 200 });
        const data = await res.json();
        type OpenWeatherGeocodeItem = {
            name: string;
            lat: number;
            lon: number;
            country: string;
            state?: string;
        };
        const mapped = (data as OpenWeatherGeocodeItem[]).map((item) => ({
            name: item.name,
            lat: item.lat,
            lon: item.lon,
            country: item.country,
            state: item.state
        }));
        geocodeCache.set(key, { ts: Date.now(), data: mapped });
        return NextResponse.json(mapped);
    } catch (e) {
        return NextResponse.json([], { status: 200 });
    }
}
