'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DriverLocation } from '@/lib/types';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const departureIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const arrivalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RideMapProps {
  departureLocation: { lat: number; lng: number; address: string };
  arrivalLocation: { lat: number; lng: number; address: string };
  driverLocation?: DriverLocation | null;
  multipleDrivers?: DriverLocation[];
}

// Component to handle route fetching and bounds fitting
function MapController({ 
  departure, 
  arrival, 
  driverLoc 
}: { 
  departure: { lat: number; lng: number; address: string };
  arrival: { lat: number; lng: number; address: string };
  driverLoc?: DriverLocation | null;
}) {
  const map = useMap();
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Ensure the Leaflet instance is fully mounted before mutating it.
    const run = async () => {
      if (!map) return;

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${departure.lng},${departure.lat};${arrival.lng},${arrival.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        if (cancelled) return;

        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          );
          setRoutePoints(coords);
          
          map.whenReady(() => {
            if (cancelled || coords.length === 0) return;
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          });
        } else {
          // Fallback: fit to departure and arrival points
          map.whenReady(() => {
            if (cancelled) return;
            const bounds = L.latLngBounds(
              [departure.lat, departure.lng],
              [arrival.lat, arrival.lng]
            );
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          });
        }
      } catch (error) {
        console.error('Route fetch error:', error);
        if (!cancelled) {
          map.whenReady(() => {
            if (cancelled) return;
            const bounds = L.latLngBounds(
              [departure.lat, departure.lng],
              [arrival.lat, arrival.lng]
            );
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [map, departure, arrival]);

  // Update map when driver location changes
  useEffect(() => {
    if (!map || !driverLoc) return;
    // Optionally pan to driver location or update marker position
    // This is handled via marker component re-rendering
  }, [map, driverLoc]);

  return (
    <>
      {routePoints.length > 0 && (
        <Polyline
          positions={routePoints}
          pathOptions={{ color: 'blue', weight: 4, opacity: 0.7 }}
        />
      )}
    </>
  );
}

export default function RideMap({
  departureLocation,
  arrivalLocation,
  driverLocation,
  multipleDrivers = [],
}: RideMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-96 w-full rounded-lg bg-gray-200 animate-pulse" />;
  }

  const center = [
    (departureLocation.lat + arrivalLocation.lat) / 2,
    (departureLocation.lng + arrivalLocation.lng) / 2,
  ] as [number, number];

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route controller */}
        <MapController 
          departure={departureLocation}
          arrival={arrivalLocation}
          driverLoc={driverLocation}
        />

        {/* Departure Marker */}
        <Marker position={[departureLocation.lat, departureLocation.lng]} icon={departureIcon}>
          <Popup>
            <strong>Departure</strong>
            <br />
            {departureLocation.address}
          </Popup>
        </Marker>

        {/* Arrival Marker */}
        <Marker position={[arrivalLocation.lat, arrivalLocation.lng]} icon={arrivalIcon}>
          <Popup>
            <strong>Arrival</strong>
            <br />
            {arrivalLocation.address}
          </Popup>
        </Marker>

        {/* Driver Location Marker (if available) */}
        {driverLocation && (
          <Marker
            position={[driverLocation.lat, driverLocation.lng]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
              iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })}
          >
            <Popup>Driver Location</Popup>
          </Marker>
        )}

        {/* Multiple driver locations (for debugging or additional drivers) */}
        {multipleDrivers.map((loc, idx) => (
          <Marker
            key={idx}
            position={[loc.lat, loc.lng]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
              iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })}
          >
            <Popup>Driver {idx + 1}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}