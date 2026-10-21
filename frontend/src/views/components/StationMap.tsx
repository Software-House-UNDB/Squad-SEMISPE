import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Station } from '../../models/station.model'
import { AIR_QUALITY_COLOR, AIR_QUALITY_LABEL, getAirQuality, type AirQuality } from '../../utils/airQuality'

const SAO_LUIS_CENTER: [number, number] = [-2.53, -44.3]

function createPinIcon(quality: AirQuality) {
  const color = AIR_QUALITY_COLOR[quality]
  return L.divIcon({
    className: '',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
    tooltipAnchor: [0, -40],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11.3 15 27 15 27s15-15.7 15-27C30 6.7 23.3 0 15 0z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="15" cy="15" r="5.5" fill="#ffffff"/>
    </svg>`,
  })
}

function FitToStations({ stations }: { stations: Station[] }) {
  const map = useMap()

  useEffect(() => {
    if (stations.length === 0) return
    const bounds = L.latLngBounds(stations.map((s) => [s.latitude, s.longitude] as [number, number]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
  }, [map, stations])

  return null
}

export default function StationMap({ stations }: { stations: Station[] }) {
  return (
    <MapContainer center={SAO_LUIS_CENTER} zoom={12} className="h-full w-full rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToStations stations={stations} />

      {stations.map((station) => {
        const quality = getAirQuality(station.aqi)
        return (
          <Marker key={station.id} position={[station.latitude, station.longitude]} icon={createPinIcon(quality)}>
            <Tooltip permanent direction="top" className="station-label">
              {station.name}
            </Tooltip>
            <Popup>
              <div className="min-w-48 text-slate-900">
                <h2 className="text-base font-semibold">{station.name}</h2>
                <p className="mt-1 text-sm">
                  <span className="font-semibold" style={{ color: AIR_QUALITY_COLOR[quality] }}>
                    {AIR_QUALITY_LABEL[quality]}
                  </span>
                  {station.aqi !== null && <> · AQI {station.aqi}</>}
                </p>
                <p className="text-xs text-slate-500">
                  {station.online ? 'Online' : 'Offline'}
                  {station.lastDataReceivedAt &&
                    ` · atualizado em ${new Date(station.lastDataReceivedAt).toLocaleString('pt-BR')}`}
                </p>
                <ul className="mt-2 space-y-0.5 text-xs">
                  {station.parameters
                    .filter((p) => p.value !== null)
                    .map((p) => (
                      <li key={p.key}>
                        {p.name}: <strong>{p.value}</strong> {p.unit}
                      </li>
                    ))}
                </ul>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
