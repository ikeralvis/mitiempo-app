"use client";

import { useState } from 'react';
import WeatherSearch from "./components/WeatherSearch";
import CurrentWeatherCard from "./components/CurrentWeatherCard";
import HourlyForecastCard from "./components/HourlyForecastCard";
import DailyForecastCard from "./components/DailyForecastCard";
import { City, WeatherData, getWeatherData } from "./lib/weather";

const FAVORITES_KEY = 'mt_favorites_v1';

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<City[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_KEY) : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const persistFavorites = (next: City[]) => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleToggleFavorite = (city: { name: string; lat: number; lon: number; country: string; state?: string }) => {
    const exists = favorites.find(f => f.lat === city.lat && f.lon === city.lon);
    if (exists) {
      const next = favorites.filter(f => !(f.lat === city.lat && f.lon === city.lon));
      persistFavorites(next);
    } else {
      const next = [...favorites, city];
      persistFavorites(next);
    }
  };

  const handleCitySelect = async (city: City) => {
    setIsLoading(true);
    setError(null);
    setSelectedCity(city);
    const data = await getWeatherData(city.lat, city.lon);
    if (data) {
      setWeather(data);
    } else {
      setError('No se pudo obtener el clima. Verifica tu API key.');
    }
    setIsLoading(false);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible en este navegador.');
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const data = await getWeatherData(lat, lon);
      if (data) {
        setWeather(data);
        setSelectedCity({ name: data.city, lat, lon, country: data.country });
      } else {
        setError('No se pudo obtener el clima desde tu ubicación.');
      }
      setIsLoading(false);
    }, (err) => {
      setError('No se pudo obtener la ubicación: ' + err.message);
      setIsLoading(false);
    }, { enableHighAccuracy: true, maximumAge: 60_000 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 font-sans">
      <main className="w-full max-w-6xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-300 mb-1">☀️ Mi Tiempo</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Consulta el clima en cualquier ciudad</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleUseMyLocation} className="px-3 py-2 rounded-lg border border-solid border-transparent bg-white/80 dark:bg-gray-800/80 hover:opacity-95">
              Usar mi ubicación
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6">
          <section>
            <WeatherSearch onCitySelect={handleCitySelect} />

            {isLoading && (
              <div className="loading-container">
                <div className="loading-spinner" />
                <span>Cargando clima...</span>
              </div>
            )}

            {error && (
              <div className="error-message">{error}</div>
            )}

            {weather && !isLoading && (
              <div className="weather-content mt-6">
                <CurrentWeatherCard
                  weather={weather.current}
                  city={weather.city}
                  country={weather.country}
                  isFavorite={!!(selectedCity && favorites.find(f => f.lat === selectedCity.lat && f.lon === selectedCity.lon))}
                  onToggleFavorite={() => selectedCity && handleToggleFavorite(selectedCity)}
                />
                <div className="mt-4">
                  <HourlyForecastCard hourly={weather.hourly} />
                </div>
                <div className="mt-4">
                  <DailyForecastCard daily={weather.daily} />
                </div>
              </div>
            )}

            {!weather && !isLoading && !error && (
              <div className="empty-state mt-6">
                <div className="empty-icon">🌤️</div>
                <p>Busca una ciudad para ver el clima</p>
              </div>
            )}
          </section>

          <aside>
            <div className="forecast-card">
              <h3 className="forecast-title">Favoritos</h3>
              {favorites.length === 0 && <p className="text-zinc-500">No hay favoritos. Añade ciudades desde la tarjeta de clima.</p>}
              <div className="mt-2 flex flex-col gap-2">
                {favorites.map((f, idx) => (
                  <div key={`${f.lat}-${f.lon}-${idx}`} className="daily-item">
                    <div className="flex-1">
                      <div className="city-name">{f.name}</div>
                      <div className="city-details">{f.state ? `${f.state}, ` : ''}{f.country}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleCitySelect(f)} className="px-3 py-1 rounded-md bg-white/70">Ver</button>
                      <button onClick={() => handleToggleFavorite(f)} className="px-3 py-1 rounded-md bg-red-50 text-red-600">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
