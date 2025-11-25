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

    try {
        const res = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((item: {
            name: string;
            lat: number;
            lon: number;
            country: string;
            state?: string;
        }) => ({
            name: item.name,
            lat: item.lat,
            lon: item.lon,
            country: item.country,
            state: item.state,
        }));
    } catch {
        return [];
    }
}

// Obtener clima actual y pronóstico (One Call API 3.0 o fallback a 2.5)
export async function getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
    try {
        // Intentamos con la API gratuita (Current Weather + Forecast 5 days)
        const [currentRes, forecastRes] = await Promise.all([
            fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`
            ),
            fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`
            ),
        ]);

        if (!currentRes.ok || !forecastRes.ok) return null;

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        // Procesar datos actuales
        const current: CurrentWeather = {
            temp: Math.round(currentData.main.temp),
            feels_like: Math.round(currentData.main.feels_like),
            humidity: currentData.main.humidity,
            wind_speed: Math.round(currentData.wind.speed * 3.6), // m/s a km/h
            description: currentData.weather[0].description,
            icon: currentData.weather[0].icon,
            dt: currentData.dt,
        };

        // Procesar pronóstico por horas (próximas 24 horas, cada 3 horas)
        interface ForecastItem {
            dt: number;
            main: {
                temp: number;
            };
            weather: {
                icon: string;
                description: string;
            }[];
            pop?: number;
        }

        const hourly: HourlyForecast[] = forecastData.list.slice(0, 8).map((item: ForecastItem) => ({
            dt: item.dt,
            temp: Math.round(item.main.temp),
            icon: item.weather[0].icon,
            description: item.weather[0].description,
            pop: Math.round((item.pop || 0) * 100),
        }));

        // Procesar pronóstico por días (agrupar por día)
        const dailyMap = new Map<string, ForecastItem[]>();
        forecastData.list.forEach((item: ForecastItem) => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!dailyMap.has(date)) {
                dailyMap.set(date, []);
            }
            dailyMap.get(date)!.push(item);
        });

        const daily: DailyForecast[] = Array.from(dailyMap.entries())
            .slice(0, 5)
            .map(([_, items]) => {
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

        return {
            city: currentData.name,
            country: currentData.sys.country,
            current,
            hourly,
            daily,
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
