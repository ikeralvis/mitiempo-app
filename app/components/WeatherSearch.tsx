"use client";

import { useState, useEffect, useRef } from 'react';
import { searchCities, City } from '../lib/weather';

interface WeatherSearchProps {
    onCitySelect: (city: City) => void;
}

export default function WeatherSearch({ onCitySelect }: WeatherSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<City[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>(undefined);

    // Buscar ciudades con debounce
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        debounceRef.current = setTimeout(async () => {
            const cities = await searchCities(query);
            setResults(cities);
            setIsLoading(false);
            setShowResults(true);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    // Cerrar resultados al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectCity = (city: City) => {
        setQuery(`${city.name}, ${city.country}`);
        setShowResults(false);
        onCitySelect(city);
    };

    return (
        <div className="weather-search-container" ref={searchRef}>
            <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    className="weather-search-input"
                    placeholder="Buscar ciudad..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                />
                {isLoading && <div className="search-spinner" />}
            </div>

            {showResults && results.length > 0 && (
                <ul className="weather-search-results">
                    {results.map((city, idx) => (
                        <li key={`${city.lat}-${city.lon}-${idx}`} onClick={() => handleSelectCity(city)}>
                            <span className="city-name">{city.name}</span>
                            <span className="city-details">
                                {city.state && `${city.state}, `}{city.country}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
                <div className="weather-search-no-results">
                    No se encontraron ciudades
                </div>
            )}
        </div>
    );
}
