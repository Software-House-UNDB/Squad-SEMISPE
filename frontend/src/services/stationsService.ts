import type { Station } from '../models/station.model'

const API_URL = import.meta.env.VITE_API_URL ?? '/api/'

export async function listStations(): Promise<Station[]> {
  const response = await fetch(new URL('stations', new URL(API_URL, window.location.origin)))

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message ?? `Falha ao carregar estações (${response.status})`)
  }

  return response.json()
}
