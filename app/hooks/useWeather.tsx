"use client";

import { useState } from "react";
import { City, WeatherData, getWeatherData } from "../lib/weather";

const FAVORITES_KEY = "mt_favorites_v1";

export default function useWeather() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<City[]>(() => {
        try {
            if (typeof window === "undefined") return [];
            const raw = localStorage.getItem(FAVORITES_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

    const persistFavorites = (next: City[]) => {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        } catch { }
        setFavorites(next);
    };

    const toggleFavorite = (city: City) => {
        const exists = favorites.find((f) => f.lat === city.lat && f.lon === city.lon);
        if (exists) {
            const next = favorites.filter((f) => !(f.lat === city.lat && f.lon === city.lon));
            persistFavorites(next);
        } else {
            const next = [...favorites, city];
            persistFavorites(next);
        }
    };

    const selectCity = async (city: City) => {
        setIsLoading(true);
        setError(null);
        setSelectedCity(city);
        try {
            const data = await getWeatherData(city.lat, city.lon);
            if (data) setWeather(data);
            else setError("No se pudo obtener el clima. Verifica tu API key.");
        } catch {
            setError("Error al obtener el clima");
        }
        setIsLoading(false);
    };

    const fetchMyLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocalización no disponible en este navegador.");
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                try {
                    const data = await getWeatherData(lat, lon);
                    if (data) {
                        setWeather(data);
                        setSelectedCity({ name: data.city, lat, lon, country: data.country });
                    } else {
                        setError("No se pudo obtener el clima desde tu ubicación.");
                    }
                } catch {
                    setError("Error al obtener el clima desde tu ubicación.");
                }
                setIsLoading(false);
            },
            (err) => {
                setError("No se pudo obtener la ubicación: " + err.message);
                setIsLoading(false);
            },
            { enableHighAccuracy: true, maximumAge: 60_000 }
        );
    };

    return {
        weather,
        isLoading,
        error,
        favorites,
        selectedCity,
        toggleFavorite,
        selectCity,
        fetchMyLocation,
        setError,
    };
}
