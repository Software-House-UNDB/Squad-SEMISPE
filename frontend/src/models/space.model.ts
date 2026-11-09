/** Situação do espaço no backend: só os ativos ficam disponíveis para reserva */
export type SpaceState = 'active' | 'inactive';

/** Espaço físico do Parque, no mesmo formato de `GET /api/spaces` */
export interface Space {
  id: number;
  name: string;
  description: string | null;
  /** Lotação máxima, em pessoas (null só no conteúdo provisório, enquanto não informada) */
  capacity: number | null;
  photoUrls: string[];
  /** Equipamentos que podem ser solicitados na reserva deste espaço */
  equipment: string[];
  state: SpaceState;
}

/** Comodidade oferecida nos espaços (ar-condicionado, Wi-Fi...) */
export interface SpaceAmenity {
  id: 'ar-condicionado' | 'wifi' | 'lousa' | 'som' | 'microfones';
  label: string;
}
