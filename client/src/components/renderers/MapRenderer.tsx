import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useLang } from '../../i18n/LanguageContext';
import L from 'leaflet';
interface Props { data: any }

const MapRenderer = ({ data }: Props) => {
      const { t } = useLang();  

  if (!data || !data.features) {
    return <div className="text-gray-500 text-sm p-4">{t('home.geo')}</div>;
  }

  return (
    <div className="h-[70vh] rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[40.4, 47.9]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
               <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-dark"
        />
               <GeoJSON
          data={data}
          style={{
            color: '#22d3ee',
            weight: 1.5,
            fillColor: '#a855f7',
            fillOpacity: 0.25
          }}
          pointToLayer={(_feature, latlng) =>
            L.circleMarker(latlng, {
              radius: 6,
              fillColor: '#22d3ee',
              color: '#0e7490',
              weight: 1.5,
              opacity: 1,
              fillOpacity: 0.85,
            })
          }
          onEachFeature={(feature, layer) => {
            const props = feature.properties || {};
            const name = props.name || props.NAME || props.title || '—';
            const address = props.address || props.ADDRESS || props.unvan || '';
            const html = `
              <div style="font-family: sans-serif; font-size: 12px; color: #111; min-width: 180px;">
                <div style="font-weight: 600; margin-bottom: 4px;">${name}</div>
                ${address ? `<div style="color: #555;">${address}</div>` : ''}
              </div>
            `;
            layer.bindPopup(html);
            layer.bindTooltip(name, { sticky: true });
          }}
        />
      </MapContainer>
    </div>
  );
};

export default MapRenderer;