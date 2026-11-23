import type { Station } from '../models/station.model'
import { apiClient } from './api'

export function listStations(): Promise<Station[]> {
  return apiClient<Station[]>('stations')
}
