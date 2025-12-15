import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function CoordinateMap({ latitude, longitude }) {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!latitude || !longitude) {
      setCoords(null);
      return;
    }

    try {
      // Convert DDMMSS to decimal
      const convertToDecimal = (value, isLongitude = false) => {
        // If already decimal
        if (typeof value === 'number' || (typeof value === 'string' && value.includes('.'))) {
          const num = parseFloat(value);
          if (!isNaN(num)) return num;
        }

        const str = String(value).padStart(isLongitude ? 7 : 6, '0');
        
        let degrees, minutes, seconds;
        
        if (isLongitude) {
          // Longitude: DDDMMSS (7 digits)
          degrees = parseInt(str.substring(0, 3));
          minutes = parseInt(str.substring(3, 5));
          seconds = parseInt(str.substring(5, 7));
        } else {
          // Latitude: DDMMSS (6 digits)
          degrees = parseInt(str.substring(0, 2));
          minutes = parseInt(str.substring(2, 4));
          seconds = parseInt(str.substring(4, 6));
        }
        
        let decimal = degrees + (minutes / 60) + (seconds / 3600);
        
        // No hemisfério sul e oeste, coordenadas são negativas
        decimal = -decimal;
        
        return parseFloat(decimal.toFixed(6));
      };

      const lat = convertToDecimal(latitude, false);
      const lng = convertToDecimal(longitude, true);

      // Validar coordenadas
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 0 || lng < -180 || lng > 0) {
        setError('Coordenadas inválidas');
        setCoords(null);
        return;
      }

      setCoords({ lat, lng });
      setError(null);
    } catch (err) {
      console.error('Erro ao converter coordenadas:', err);
      setError('Erro ao processar coordenadas');
      setCoords(null);
    }
  }, [latitude, longitude]);

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-100 text-slate-500">
        {error}
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-100 text-slate-500">
        Digite as coordenadas para visualizar o mapa
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        key={`${coords.lat}-${coords.lng}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coords.lat, coords.lng]}>
          <Popup>
            Lat: {coords.lat.toFixed(6)}<br />
            Lng: {coords.lng.toFixed(6)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}