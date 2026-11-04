import { useCallback, useState, useSyncExternalStore } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MAIN_NAV_ITEMS, type NavItem } from '../models/navigation.model';
import { type Space, type SpaceAmenity } from '../models/space.model';
import {
  type EstruturaMenuItem,
  type OpeningHours,
  type ParqueAddress,
  type SocialLink,
} from '../models/estrutura.model';
import { useSiteNavigation } from './useSiteNavigation';

// Conteúdo provisório, tirado do site de agendamento da SEMISPE (o Coworking vem do
// documento de requisitos): substituir pelos dados de GET /api/spaces. Ainda faltam
// as fotos (aguardando as originais da SEMISPE), as descrições e os equipamentos de
// cada espaço e os dados do Coworking
export const DEFAULT_SPACES: Space[] = [
  {
    id: 1,
    name: 'Sala de Reunião 1',
    description: null,
    capacity: 8,
    photoUrls: [],
    equipment: [],
    state: 'active',
  },
  {
    id: 2,
    name: 'Sala de Reunião 2',
    description: null,
    capacity: 12,
    photoUrls: [],
    equipment: [],
    state: 'active',
  },
  {
    id: 3,
    name: 'Sala de Reunião Master',
    description: 'Junção das salas de reunião 1 e 2.',
    capacity: 20,
    photoUrls: [],
    equipment: [],
    state: 'active',
  },
  {
    id: 4,
    name: 'Espaço Multiuso',
    description: null,
    capacity: 200,
    photoUrls: [],
    equipment: [],
    state: 'active',
  },
  {
    id: 5,
    name: 'Mini Auditório',
    description: null,
    capacity: 30,
    photoUrls: [],
    equipment: [],
    state: 'active',
  },
  {
    id: 6,
    name: 'Coworking',
    description: null,
    capacity: null,
    photoUrls: [],
    equipment: [],
    state: 'active',
  },
];

export const SPACE_AMENITIES: readonly SpaceAmenity[] = [
  { id: 'ar-condicionado', label: 'Ar-condicionado' },
  { id: 'wifi', label: 'Wi-Fi gratuito' },
  { id: 'lousa', label: 'Lousa interativa' },
  { id: 'som', label: 'Caixa de som' },
  { id: 'microfones', label: 'Microfones sem fio' },
];

export const ESTRUTURA_MENU: readonly EstruturaMenuItem[] = [
  { id: 'espacos', label: 'Nossos espaços', to: '/estrutura', isReady: true },
  { id: 'agenda', label: 'Agenda', to: '/estrutura/agenda', isReady: true },
  { id: 'reserva', label: 'Fazer reserva', to: '/estrutura/reserva', isReady: true },
  { id: 'como-funciona', label: 'Como funciona', to: '/estrutura/como-funciona', isReady: false },
  { id: 'duvidas', label: 'Dúvidas frequentes', to: '/estrutura/duvidas', isReady: false },
];

export const OPENING_HOURS: readonly OpeningHours[] = [
  { days: 'Segunda a quinta', hours: '8h às 18h' },
  { days: 'Sexta-feira', hours: '8h às 14h' },
];

/**
 * O mesmo funcionamento de OPENING_HOURS, em minutos desde a meia-noite, por dia
 * da semana (0 = domingo, como em Date.getDay). null = fechado. Os horários da
 * reserva ficam dentro destas faixas.
 */
export const BUSINESS_HOURS: Readonly<Record<number, { open: number; close: number } | null>> = {
  0: null,
  1: { open: 8 * 60, close: 18 * 60 },
  2: { open: 8 * 60, close: 18 * 60 },
  3: { open: 8 * 60, close: 18 * 60 },
  4: { open: 8 * 60, close: 18 * 60 },
  5: { open: 8 * 60, close: 14 * 60 },
  6: null,
};

export const PARQUE_ADDRESS: ParqueAddress = {
  place: 'Armazém Dona Teté',
  complex: 'Complexo do Trapiche Santo Ângelo',
  street: 'Av. Vitorino Freire, s/n, Centro, São Luís - MA',
  mapUrl: 'https://maps.app.goo.gl/izyVBpVP2mpPCixm8',
};

export const SEMISPE_INSTAGRAM: SocialLink = {
  handle: '@semispe',
  url: 'https://www.instagram.com/semispe.saoluis/',
};

/**
 * Agenda pública da SEMISPE no Google Agenda, a mesma do site de agendamento
 * atual. Depois pode ser trocada por uma agenda própria, alimentada pelas
 * reservas do backend.
 */
export const AGENDA_CALENDAR = {
  id: 'semispe.agenda@gmail.com',
  timeZone: 'America/Fortaleza',
} as const;

/** 'MONTH' mostra o mês em grade; 'AGENDA' lista os próximos eventos (melhor em tela estreita) */
type AgendaMode = 'MONTH' | 'AGENDA';

function buildAgendaUrl(mode?: AgendaMode): string {
  const params = new URLSearchParams({ src: AGENDA_CALENDAR.id, ctz: AGENDA_CALENDAR.timeZone, hl: 'pt_BR' });
  if (mode) {
    // Só o calendário, sem título, fuso, impressão e lista de agendas do Google
    params.set('mode', mode);
    params.set('showTitle', '0');
    params.set('showPrint', '0');
    params.set('showTz', '0');
    params.set('showCalendars', '0');
    params.set('color', '#1F71B7');
  }
  return `https://calendar.google.com/calendar/embed?${params}`;
}

const AGENDA_COMPACT_QUERY = '(max-width: 767px)';

function subscribeToAgendaQuery(onChange: () => void) {
  const query = window.matchMedia(AGENDA_COMPACT_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const isAgendaCompact = () => window.matchMedia(AGENDA_COMPACT_QUERY).matches;

export interface EstruturaViewModel {
  navItems: readonly NavItem[];
  activeSection: string;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  onNavigateToSection: (href: string, sectionId: string) => void;
  menu: readonly EstruturaMenuItem[];
  /** Espaços disponíveis para reserva */
  spaces: readonly Space[];
  amenities: readonly SpaceAmenity[];
  openingHours: readonly OpeningHours[];
  address: ParqueAddress;
  instagram: SocialLink;
  /** Rota do chat de reserva já com o espaço escolhido */
  reservaHref: (spaceId: number) => string;
  /** Google Agenda incorporado: mês no desktop, lista de eventos no celular */
  agendaEmbedUrl: string;
  /** A mesma agenda aberta direto no Google, em tela cheia */
  agendaPublicUrl: string;
}

export function useEstruturaViewModel(): EstruturaViewModel {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const navigateTo = useSiteNavigation();

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const onNavigateToSection = useCallback((href: string) => {
    setIsMobileMenuOpen(false);
    navigateTo(href);
  }, [navigateTo]);

  const reservaHref = useCallback((spaceId: number) => `/estrutura/reserva?espaco=${spaceId}`, []);

  const isCompact = useSyncExternalStore(subscribeToAgendaQuery, isAgendaCompact);

  return {
    navItems: MAIN_NAV_ITEMS,
    activeSection: 'estrutura',
    isMobileMenuOpen,
    toggleMobileMenu,
    onNavigateToSection,
    menu: ESTRUTURA_MENU,
    spaces: DEFAULT_SPACES.filter((space) => space.state === 'active'),
    amenities: SPACE_AMENITIES,
    openingHours: OPENING_HOURS,
    address: PARQUE_ADDRESS,
    instagram: SEMISPE_INSTAGRAM,
    reservaHref,
    agendaEmbedUrl: buildAgendaUrl(isCompact ? 'AGENDA' : 'MONTH'),
    agendaPublicUrl: buildAgendaUrl(),
  };
}

/** ViewModel da Estrutura nas telas abertas dentro do layout (menu lateral) */
export function useEstruturaContext(): EstruturaViewModel {
  return useOutletContext<EstruturaViewModel>();
}
