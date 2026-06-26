// components/ui/LocationPicker.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Crosshair, MapPin, Loader2 } from 'lucide-react';

// Leaflet icon fix for Next.js
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  label?: string;
  placeholder?: string;
  value?: { lat: number; lng: number; address: string } | null;
  onChange?: (location: { lat: number; lng: number; address: string } | null) => void;
  className?: string;
}

// Reverse geocode: lat/lng -> address
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// Search: query -> list of results
async function searchLocation(query: string): Promise<{ address: string; lat: number; lng: number }[]> {
  if (!query || query.length < 3) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
  );
  const data = await res.json();
  return data.map((item: any) => ({
    address: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

// Map click handler
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Fly to location
function FlyTo({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 15, { duration: 1 });
    }
  }, [position, map]);
  return null;
}

export default function LocationPicker({
  label = 'Location',
  placeholder = 'Search for a place...',
  value,
  onChange,
  className = '',
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ address: string; lat: number; lng: number }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );
  const [address, setAddress] = useState<string>(value?.address || '');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Default center (Dhaka University for example)
  const defaultCenter: [number, number] = [23.7334, 90.3925];

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedPosition({ lat, lng });
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
    onChange?.({ lat, lng, address: addr });
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocation(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  // Select from search results
  const handleSelectResult = async (result: { address: string; lat: number; lng: number }) => {
    setSearchQuery(result.address);
    setSearchResults([]);
    setSelectedPosition({ lat: result.lat, lng: result.lng });
    setAddress(result.address);
    onChange?.({ lat: result.lat, lng: result.lng, address: result.address });
  };

  // Get current GPS location
  const handleGetGPS = () => {
    setIsGettingGPS(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setIsGettingGPS(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelectedPosition({ lat: latitude, lng: longitude });
        const addr = await reverseGeocode(latitude, longitude);
        setAddress(addr);
        onChange?.({ lat: latitude, lng: longitude, address: addr });
        setIsGettingGPS(false);
      },
      (err) => {
        console.error('GPS Error:', err);
        alert('Could not get your location. Please allow location access.');
        setIsGettingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && <label className="text-sm font-medium">{label}</label>}

      {/* Search bar + GPS button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-4"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleGetGPS}
          disabled={isGettingGPS}
          title="Use my current location"
        >
          {isGettingGPS ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search results dropdown */}
      {searchResults.length > 0 && (
        <div className="border rounded-lg shadow-lg bg-white max-h-48 overflow-y-auto z-50 relative">
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-start gap-2 border-b last:border-0"
              onClick={() => handleSelectResult(result)}
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="line-clamp-2">{result.address}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="w-full h-64 rounded-lg overflow-hidden border relative">
        <MapContainer
          center={defaultCenter}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <MapClickHandler onMapClick={handleMapClick} />

          {selectedPosition && <FlyTo position={selectedPosition} />}

          {selectedPosition && (
            <Marker position={[selectedPosition.lat, selectedPosition.lng]} draggable={true}>
              <Popup>Selected Location</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Address display overlay */}
        {address && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded shadow text-xs truncate">
            📍 {address}
          </div>
        )}

        {/* Map hint */}
        {!selectedPosition && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white px-4 py-2 rounded text-xs pointer-events-none">
            Click on the map to select location
          </div>
        )}
      </div>

      {/* Hidden: shows selected coords */}
      {selectedPosition && (
        <p className="text-xs text-muted-foreground">
          Lat: {selectedPosition.lat.toFixed(6)}, Lng: {selectedPosition.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}