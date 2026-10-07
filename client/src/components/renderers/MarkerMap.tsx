import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { GeoDetection } from '../../utils/geoHelpers';

// Leaflet default icon problemini həll et
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

interface Props {
  detection: GeoDetection;
}

// Xəritəni mərkəzə fokuslayan köməkçi
const FitBounds = ({ points }: { points: { lat: number; lon: number }[] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon] as [number, number]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [points, map]);
  return null;
};

const MarkerMap = ({ detection }: Props) => {
  const { points, center } = detection;

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-border relative z-0">
      <MapContainer
        center={center}
        zoom={points.length > 1 ? 8 : 12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds points={points} />

        {points.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lon]}>
            <Popup>
              <div className="text-xs">
                <div className="font-semibold mb-1">{p.name || 'Obyekt'}</div>
                <div className="text-gray-500">
                  {p.lat.toFixed(5)}, {p.lon.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Marker sayı badge */}
      <div className="absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded-lg bg-bg-primary/90 backdrop-blur border border-border text-xs text-gray-200">
        📍 {points.length} marker
      </div>
    </div>
  );
};

export default MarkerMap;