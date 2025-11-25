"use client";

import { CurrentWeather, getWeatherIconUrl } from '../lib/weather';

interface CurrentWeatherCardProps {
    weather: CurrentWeather;
    city: string;
    country: string;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

export default function CurrentWeatherCard({ weather, city, country, isFavorite = false, onToggleFavorite }: CurrentWeatherCardProps) {
    return (
        <div className="current-weather-card">
            <div className="current-location" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                    <h2>{city}</h2>
                    <span>{country}</span>
                </div>
                <div>
                    <button aria-pressed={isFavorite} onClick={onToggleFavorite} className="favorite-btn" title={isFavorite ? 'Quitar favorito' : 'Añadir a favoritos'}>
                        {isFavorite ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431L23 9.587l-5.5 5.356L18.335 24 12 20.202 5.665 24l.835-9.057L1 9.587l7.332-1.569z" /></svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="current-main">
                <img
                    src={getWeatherIconUrl(weather.icon)}
                    alt={weather.description}
                    className="current-icon"
                />
                <div className="current-temp">
                    <span className="temp-value">{weather.temp}</span>
                    <span className="temp-unit">°C</span>
                </div>
            </div>

            <p className="current-description">{weather.description}</p>

            <div className="current-details">
                <div className="detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="2" width="6" height="14" rx="3" />
                        <circle cx="12" cy="19" r="3" />
                    </svg>
                    <span>Sensación: {weather.feels_like}°C</span>
                </div>
                <div className="detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                    <span>Humedad: {weather.humidity}%</span>
                </div>
                <div className="detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                    </svg>
                    <span>Viento: {weather.wind_speed} km/h</span>
                </div>
            </div>
        </div>
    );
}
