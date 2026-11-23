/** Opção do menu lateral da Estrutura */
export interface EstruturaMenuItem {
  id: 'espacos' | 'agenda' | 'reserva' | 'como-funciona' | 'duvidas';
  label: string;
  /** Rota da opção */
  to: string;
  /** Falso enquanto a tela da opção ainda está em construção */
  isReady: boolean;
}

/** Horário de funcionamento de um grupo de dias */
export interface OpeningHours {
  days: string;
  hours: string;
}

export interface ParqueAddress {
  place: string;
  complex: string;
  street: string;
  mapUrl: string;
}

export interface SocialLink {
  handle: string;
  url: string;
}
