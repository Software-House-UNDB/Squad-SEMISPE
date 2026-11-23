import type { Station } from '../models/station.model'
import { apiClient } from './api'

export interface StationsData {
  stations: Station[]
  /** Quando os dados foram coletados; só existe no modo de arquivo estático */
  generatedAt: string | null
}

/**
 * Em produção sem VITE_API_URL (ex.: GitHub Pages sem backend público) o site
 * não tem API para consultar. Nesse caso lê o stations.json, que o workflow
 * update-stations atualiza periodicamente com as credenciais nos Secrets.
 * Com VITE_API_URL, ou em desenvolvimento, usa a API normalmente.
 */
const USE_SNAPSHOT = import.meta.env.PROD && !import.meta.env.VITE_API_URL

async function fetchSnapshot(): Promise<StationsData> {
  const response = await fetch(`${import.meta.env.BASE_URL}stations.json`, { cache: 'no-cache' })
  if (!response.ok) throw new Error('Os dados das estações ainda não estão disponíveis.')

  const body = (await response.json()) as { generatedAt?: string; stations?: Station[] }
  return { stations: body.stations ?? [], generatedAt: body.generatedAt ?? null }
}

export async function listStations(): Promise<StationsData> {
  if (USE_SNAPSHOT) return fetchSnapshot()
  return { stations: await apiClient<Station[]>('stations'), generatedAt: null }
}
