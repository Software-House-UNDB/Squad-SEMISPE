export interface StationParameter {
  key: string
  name: string
  unit: string | null
  value: number | null
}

export interface Station {
  id: number
  name: string
  latitude: number
  longitude: number
  online: boolean
  lastDataReceivedAt: string | null
  aqi: number | null
  parameters: StationParameter[]
}
