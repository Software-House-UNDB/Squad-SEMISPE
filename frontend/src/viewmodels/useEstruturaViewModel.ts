import { useCallback, useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { fetchSpaces, spacesQueryKey } from '../services/spaces.service';

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

export interface EstruturaViewModel {
  navItems: readonly NavItem[];
  activeSection: string;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  onNavigateToSection: (href: string, sectionId: string) => void;
  menu: readonly EstruturaMenuItem[];
  /** Espaços disponíveis para reserva */
  spaces: readonly Space[];
  spacesLoading: boolean;
  spacesError: boolean;
  retrySpaces: () => void;
  amenities: readonly SpaceAmenity[];
  openingHours: readonly OpeningHours[];
  address: ParqueAddress;
  instagram: SocialLink;
  /** Rota do chat de reserva já com o espaço escolhido */
  reservaHref: (spaceId: number) => string;
}

export function useEstruturaViewModel(): EstruturaViewModel {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const navigateTo = useSiteNavigation();

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const onNavigateToSection = useCallback(
    (href: string) => {
      setIsMobileMenuOpen(false);
      navigateTo(href);
    },
    [navigateTo]
  );

  const catalog = useQuery({ queryKey: spacesQueryKey, queryFn: ({ signal }) => fetchSpaces(signal) });
  const reservaHref = useCallback((spaceId: number) => `/estrutura/reserva?espaco=${spaceId}`, []);

  return {
    navItems: MAIN_NAV_ITEMS,
    activeSection: 'estrutura',
    isMobileMenuOpen,
    toggleMobileMenu,
    onNavigateToSection,
    menu: ESTRUTURA_MENU,
    spaces: (catalog.data ?? []).filter((space) => space.state === 'active'),
    spacesLoading: catalog.isPending,
    spacesError: catalog.isError,
    retrySpaces: () => void catalog.refetch(),
    amenities: SPACE_AMENITIES,
    openingHours: OPENING_HOURS,
    address: PARQUE_ADDRESS,
    instagram: SEMISPE_INSTAGRAM,
    reservaHref,
  };
}

/** ViewModel da Estrutura nas telas abertas dentro do layout (menu lateral) */
export function useEstruturaContext(): EstruturaViewModel {
  return useOutletContext<EstruturaViewModel>();
}
