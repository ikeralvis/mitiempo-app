"use client";

import React from 'react';
import { City } from '../lib/weather';

interface FavoritesPanelProps {
    favorites: City[];
    onView: (city: City) => void;
    onRemove: (city: City) => void;
}

export default function FavoritesPanel({ favorites, onView, onRemove }: FavoritesPanelProps) {
    return (
        <div>
            <h3 className="forecast-title">Favoritos</h3>
            {favorites.length === 0 ? (
                <p className="text-zinc-500">No hay favoritos. Añade ciudades desde la tarjeta de clima.</p>
            ) : (
                <div className="mt-2 flex flex-col gap-2">
                    {favorites.map((f, idx) => (
                        <div key={`${f.lat}-${f.lon}-${idx}`} className="daily-item">
                            <div className="flex-1">
                                <div className="city-name">{f.name}</div>
                                <div className="city-details">{f.state ? `${f.state}, ` : ''}{f.country}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onView(f)} className="px-3 py-1 rounded-md bg-white/70">Ver</button>
                                <button onClick={() => onRemove(f)} className="px-3 py-1 rounded-md bg-red-50 text-red-600">Eliminar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
