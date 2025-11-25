"use client";

import { } from 'react';
import WeatherSearch from "./components/WeatherSearch";
import CurrentWeatherCard from "./components/CurrentWeatherCard";
import HourlyForecastCard from "./components/HourlyForecastCard";
import DailyForecastCard from "./components/DailyForecastCard";
import FavoritesPanel from "./components/FavoritesPanel";
import useWeather from "./hooks/useWeather";
import { City } from "./lib/weather";

// NOTE: FAVORITES_KEY is now managed inside the hook

export default function Home() {
  const { weather, isLoading, error, favorites, selectedCity, toggleFavorite, selectCity, fetchMyLocation } = useWeather();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 font-sans">
      <main className="w-full max-w-6xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-300 mb-1">☀️ Mi Tiempo</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Consulta el clima en cualquier ciudad</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchMyLocation()} className="px-3 py-2 rounded-lg border border-solid border-transparent bg-white/80 dark:bg-gray-800/80 hover:opacity-95">
              Usar mi ubicación
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6">
          <section>
            <WeatherSearch onCitySelect={selectCity} />

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
                  onToggleFavorite={() => selectedCity && toggleFavorite(selectedCity)}
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
              <FavoritesPanel
                favorites={favorites}
                onView={(c: City) => selectCity(c)}
                onRemove={(c: City) => toggleFavorite(c)}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
