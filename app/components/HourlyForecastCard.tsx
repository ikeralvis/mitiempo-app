"use client";

import { HourlyForecast, getWeatherIconUrl, formatTime } from '../lib/weather';

interface HourlyForecastCardProps {
    hourly: HourlyForecast[];
}

export default function HourlyForecastCard({ hourly }: HourlyForecastCardProps) {
    return (
        <div className="forecast-card">
            <h3 className="forecast-title">Próximas horas</h3>
            <div className="hourly-list">
                {hourly.map((hour, idx) => (
                    <div key={hour.dt} className="hourly-item">
                        <span className="hourly-time">{idx === 0 ? 'Ahora' : formatTime(hour.dt)}</span>
                        <img
                            src={getWeatherIconUrl(hour.icon)}
                            alt={hour.description}
                            className="hourly-icon"
                        />
                        <span className="hourly-temp">{hour.temp}°</span>
                        {hour.pop > 0 && (
                            <span className="hourly-pop">💧 {hour.pop}%</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
