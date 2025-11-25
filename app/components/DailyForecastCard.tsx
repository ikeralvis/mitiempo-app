"use client";

import { DailyForecast, getWeatherIconUrl, getDayName } from '../lib/weather';

interface DailyForecastCardProps {
    daily: DailyForecast[];
}

export default function DailyForecastCard({ daily }: DailyForecastCardProps) {
    return (
        <div className="forecast-card">
            <h3 className="forecast-title">Próximos días</h3>
            <div className="daily-list">
                {daily.map((day, idx) => (
                    <div key={day.dt} className="daily-item">
                        <span className="daily-day">{idx === 0 ? 'Hoy' : getDayName(day.dt)}</span>
                        <img
                            src={getWeatherIconUrl(day.icon)}
                            alt={day.description}
                            className="daily-icon"
                        />
                        <div className="daily-temps">
                            <span className="daily-max">{day.temp_max}°</span>
                            <span className="daily-min">{day.temp_min}°</span>
                        </div>
                        {day.pop > 0 && (
                            <span className="daily-pop">💧 {day.pop}%</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
