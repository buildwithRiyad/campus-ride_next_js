'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Location, DriverLocation } from '@/lib/types';
import 'leaflet/dist/leaflet.css';

// Icons
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Map controller
function MapController({
  driverLocation,
  departureLocation,
  arrivalLocation,
}: {
  driverLocation?: DriverLocation | null;
  departureLocation: Location;
  arrivalLocation: Location;
}) {
  const map = useMap();
  const lastRef = useRef<DriverLocation | null>(null);

  useEffect(() => {
    if (!driverLocation) return;

    const changed =
      !lastRef.current ||
      Math.abs(driverLocation.lat - lastRef.current.lat) > 0.0001 ||
      Math.abs(driverLocation.lng - lastRef.current.lng) > 0.0001;

    if (changed) {
      map.panTo([driverLocation.lat, driverLocation.lng], {
        animate: true,
      });

      lastRef.current = driverLocation;
    }
  }, [driverLocation, map]);

  useEffect(() => {
    const bounds = L.latLngBounds([
      [departureLocation.lat, departureLocation.lng],
      [arrivalLocation.lat, arrivalLocation.lng],
    ]);

    if (driverLocation) {
      bounds.extend([driverLocation.lat, driverLocation.lng]);
    }

    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, []);

  return null;
}

interface RideMapProps {
  departureLocation?: Location;
  arrivalLocation?: Location;
  driverLocation?: DriverLocation | null;
  multipleDrivers?: DriverLocation[];
  enableTracking?: boolean;
  showAccuracy?: boolean;
}

export default function RideMap({
  departureLocation,
  arrivalLocation,
  driverLocation,
  multipleDrivers = [],
  enableTracking = true,
  showAccuracy = true,
}: RideMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ SAFE GUARD (CRASH FIX)
  if (
    !isClient ||
    !departureLocation ||
    !arrivalLocation ||
    departureLocation.lat == null ||
    arrivalLocation.lat == null
  ) {
    return (
      <div className="w-full h-96 rounded-lg border bg-gray-100 animate-pulse" />
    );
  }

  const centerLat = (departureLocation.lat + arrivalLocation.lat) / 2;
  const centerLng = (departureLocation.lng + arrivalLocation.lng) / 2;

  const routePoints: [number, number][] = [
    [departureLocation.lat, departureLocation.lng],
    [arrivalLocation.lat, arrivalLocation.lng],
  ];

  const allDrivers = driverLocation
    ? [driverLocation, ...multipleDrivers]
    : multipleDrivers;

  const uniqueDrivers = Array.from(
    new Map(allDrivers.map((d) => [d.driverId, d])).values()
  ).slice(0, 10);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {enableTracking && (
          <MapController
            driverLocation={driverLocation}
            departureLocation={departureLocation}
            arrivalLocation={arrivalLocation}
          />
        )}

        {/* Route */}
        <Polyline positions={routePoints} color="blue" weight={3} opacity={0.7} />

        {/* Start */}
        <Marker position={[departureLocation.lat, departureLocation.lng]} icon={startIcon}>
          <Popup>
            <b>Departure</b>
            <br />
            {departureLocation.address}
          </Popup>
        </Marker>

        {/* End */}
        <Marker position={[arrivalLocation.lat, arrivalLocation.lng]} icon={endIcon}>
          <Popup>
            <b>Arrival</b>
            <br />
            {arrivalLocation.address}
          </Popup>
        </Marker>

        {/* Drivers */}
        {uniqueDrivers.map((driver) => (
          <Marker
            key={driver.driverId}
            position={[driver.lat, driver.lng]}
            icon={driverIcon}
          >
            <Popup>
              <b>Driver</b> {driver.driverId.slice(0, 8)}
              <br />
              {driver.speed ? `Speed: ${driver.speed.toFixed(1)} km/h` : ''}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Info Panel */}
      {showAccuracy && driverLocation && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow text-xs">
          <p>Accuracy: {driverLocation.accuracy ?? 'N/A'} m</p>
          <p>Speed: {driverLocation.speed ?? 0} km/h</p>
        </div>
      )}

      {/* Driver count */}
      {uniqueDrivers.length > 1 && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-full">
          {uniqueDrivers.length}
        </div>
      )}
    </div>
  );
}