import { useEffect, useState } from 'react'
import type { Station } from '../models/station.model'
import { listStations } from '../services/stationsService'
import { usePageNavigation } from './usePageNavigation'

export function useStationsViewModel() {
  const navigation = usePageNavigation('ar')
  const [stations, setStations] = useState<Station[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Em vez de abortar a requisicao (o StrictMode monta o efeito duas vezes em
    // dev e o cancelamento aparece como erro no Network), so ignoramos o
    // resultado de uma execucao ja desmontada.
    let ignore = false

    listStations()
      .then((data) => {
        if (!ignore) setStations(data)
      })
      .catch((err: unknown) => {
        if (!ignore) setError(err instanceof Error ? err.message : 'Não foi possível carregar as estações.')
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  return { ...navigation, stations, isLoading, error }
}
