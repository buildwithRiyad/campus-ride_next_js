'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Location, DriverLocation } from '@/lib/types';
import 'leaflet/dist/leaflet.css';

/* =========================
   ICONS
========================= */
const startIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-green.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const endIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const driverIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-blue.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/* =========================
   MAP CONTROLLER (GPS follow)
========================= */
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
  const lastDriverRef = useRef<DriverLocation | null>(null);
  const didFitRef = useRef(false);

  useEffect(() => {
    if (didFitRef.current) return;
    const bounds = L.latLngBounds([
      [departureLocation.lat, departureLocation.lng],
      [arrivalLocation.lat, arrivalLocation.lng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    didFitRef.current = true;
  }, [map, departureLocation, arrivalLocation]);

  useEffect(() => {
    if (!driverLocation) return;
    const last = lastDriverRef.current;
    const moved =
      !last ||
      Math.abs(driverLocation.lat - last.lat) > 0.0003 ||
      Math.abs(driverLocation.lng - last.lng) > 0.0003;
    if (moved) {
      map.panTo([driverLocation.lat, driverLocation.lng], { animate: true });
      lastDriverRef.current = driverLocation;
    }
  }, [driverLocation, map]);

  return null;
}

/* =========================
   MAIN COMPONENT
========================= */
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
  const [mapReady, setMapReady] = useState(false);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch route – only after map is ready
  useEffect(() => {
    if (!departureLocation || !arrivalLocation || !mapReady) return;

    const fetchRoute = async () => {
      setLoadingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${departureLocation.lng},${departureLocation.lat};${arrivalLocation.lng},${arrivalLocation.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );
          setRoutePoints(coords);
        } else {
          setRoutePoints([
            [departureLocation.lat, departureLocation.lng],
            [arrivalLocation.lat, arrivalLocation.lng],
          ]);
        }
      } catch (error) {
        console.error('Route fetch error:', error);
        setRoutePoints([
          [departureLocation.lat, departureLocation.lng],
          [arrivalLocation.lat, arrivalLocation.lng],
        ]);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [departureLocation, arrivalLocation, mapReady]);

  // Safety guard
  if (!isClient || !departureLocation || !arrivalLocation) {
    return <div className="w-full h-96 rounded-lg border bg-gray-100 animate-pulse" />;
  }

  const allDrivers = driverLocation
    ? [driverLocation, ...multipleDrivers]
    : multipleDrivers;

  const uniqueDrivers = Array.from(
    new Map(allDrivers.map((d) => [d.driverId, d])).values()
  ).slice(0, 10);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border relative">
      <MapContainer
        key="ride-map"
        center={[departureLocation.lat, departureLocation.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        whenReady={() => {
          console.log('✅ Map is ready');
          setMapReady(true);
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {enableTracking && (
          <MapController
            driverLocation={driverLocation}
            departureLocation={departureLocation}
            arrivalLocation={arrivalLocation}
          />
        )}

        {routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            color="#2563eb"
            weight={4}
            opacity={0.8}
            smoothFactor={1}
          />
        )}

        <Marker position={[departureLocation.lat, departureLocation.lng]} icon={startIcon}>
          <Popup>Departure<br />{departureLocation.address}</Popup>
        </Marker>

        <Marker position={[arrivalLocation.lat, arrivalLocation.lng]} icon={endIcon}>
          <Popup>Arrival<br />{arrivalLocation.address}</Popup>
        </Marker>

        {uniqueDrivers.map((driver) => (
          <Marker key={driver.driverId} position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>Driver {driver.driverId.slice(0, 8)}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {loadingRoute && (
        <div className="absolute top-4 left-4 bg-white p-2 rounded shadow text-xs">
          Loading route...
        </div>
      )}

      {showAccuracy && driverLocation && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow text-xs">
          <p>Accuracy: {driverLocation.accuracy ?? 'N/A'} m</p>
          <p>Speed: {driverLocation.speed ?? 0} km/h</p>
        </div>
      )}

      {uniqueDrivers.length > 1 && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-full">
          {uniqueDrivers.length}
        </div>
      )}
    </div>
  );
}