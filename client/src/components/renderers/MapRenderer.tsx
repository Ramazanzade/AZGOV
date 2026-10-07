import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useLang } from '../../i18n/LanguageContext';

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
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <GeoJSON
          data={data}
          style={{
            color: '#22d3ee',
            weight: 1.5,
            fillColor: '#a855f7',
            fillOpacity: 0.25
          }}
        />
      </MapContainer>
    </div>
  );
};

export default MapRenderer;