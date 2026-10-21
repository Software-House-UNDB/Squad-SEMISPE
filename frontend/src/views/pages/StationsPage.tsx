import { useStationsViewModel } from '../../viewmodels/useStationsViewModel'
import { AIR_QUALITY_COLOR, AIR_QUALITY_LABEL, POLLUTED_AQI_THRESHOLD, type AirQuality } from '../../utils/airQuality'
import StationMap from '../components/StationMap'

const LEGEND: AirQuality[] = ['good', 'polluted', 'unknown']

export default function StationsPage() {
  const { stations, isLoading, error } = useStationsViewModel()

  return (
    <main className="flex h-screen flex-col gap-4 bg-slate-950 p-6 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estações</h1>
          <p className="text-sm text-slate-400">Qualidade do ar em São Luís</p>
        </div>

        <ul className="flex items-center gap-4 text-sm">
          {LEGEND.map((quality) => (
            <li key={quality} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: AIR_QUALITY_COLOR[quality] }} />
              {AIR_QUALITY_LABEL[quality]}
              {quality === 'polluted' && <span className="text-slate-500">(AQI &gt; {POLLUTED_AQI_THRESHOLD})</span>}
            </li>
          ))}
        </ul>
      </header>

      {isLoading && <p className="text-slate-400">Carregando estações...</p>}
      {error && <p className="text-red-400">{error}</p>}

      <div className="min-h-0 flex-1">
        <StationMap stations={stations} />
      </div>
    </main>
  )
}
