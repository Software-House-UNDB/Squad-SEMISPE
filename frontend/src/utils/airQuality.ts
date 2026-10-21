export type AirQuality = 'good' | 'polluted' | 'unknown'

// AQI acima deste valor e considerado poluido (faixa "insalubre" da escala EPA).
export const POLLUTED_AQI_THRESHOLD = 100

export function getAirQuality(aqi: number | null): AirQuality {
  if (aqi === null) return 'unknown'
  return aqi > POLLUTED_AQI_THRESHOLD ? 'polluted' : 'good'
}

export const AIR_QUALITY_COLOR: Record<AirQuality, string> = {
  good: '#16a34a',
  polluted: '#dc2626',
  unknown: '#6b7280',
}

export const AIR_QUALITY_LABEL: Record<AirQuality, string> = {
  good: 'Bom',
  polluted: 'Poluído',
  unknown: 'Sem dados',
}
