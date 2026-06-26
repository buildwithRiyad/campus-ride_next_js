'use client';

import { useState } from 'react';
import { searchLocation } from '@/lib/geocode';

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  label: string;
  onSelect: (location: LocationData) => void;
}

export default function LocationInput({
  label,
  onSelect,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (
    value: string
  ) => {
    setQuery(value);

    if (value.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const data =
        await searchLocation(value);

      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        value={query}
        onChange={(e) =>
          handleSearch(e.target.value)
        }
        className="w-full border rounded-md px-3 py-2"
        placeholder="Search location..."
      />

      {loading && (
        <div className="text-xs text-gray-500">
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute z-50 bg-white border rounded-md shadow-lg w-full max-h-64 overflow-auto">
          {results.map((item) => (
            <button
              key={`${item.lat}-${item.lng}`}
              type="button"
              className="w-full text-left p-3 hover:bg-gray-100 border-b"
              onClick={() => {
                setQuery(item.address);
                setResults([]);
                onSelect(item);
              }}
            >
              {item.address}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}