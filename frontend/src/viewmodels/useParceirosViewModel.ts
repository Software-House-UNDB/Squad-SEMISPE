import { useState } from 'react';
import { MAIN_NAV_ITEMS, type NavItem } from '../models/navigation.model';
import { type Partner, type PartnerCategory } from '../models/partner.model';
import { usePageNavigation, type PageNavigationViewModel } from './usePageNavigation';
import { usePartners, type PartnersViewModel } from './usePartners';

export type PartnerFilter = PartnerCategory | 'todos';

const PARCEIROS_SECTION = MAIN_NAV_ITEMS.find((item) => item.id === 'parceiros')!;

export interface ParceirosViewModel extends PageNavigationViewModel {
  section: NavItem;
  data: PartnersViewModel;
  filter: PartnerFilter;
  setFilter: (filter: PartnerFilter) => void;
  /** Parceiros da categoria escolhida no filtro */
  visiblePartners: readonly Partner[];
  /** Parceiro aberto no detalhe (null com o detalhe fechado) */
  selectedPartner: Partner | null;
  openPartner: (partner: Partner) => void;
  closePartner: () => void;
}

/** Página /parceiros: contadores, filtro por categoria e o detalhe de cada parceiro */
export function useParceirosViewModel(): ParceirosViewModel {
  const navigation = usePageNavigation(PARCEIROS_SECTION.id);
  const data = usePartners();
  const [filter, setFilter] = useState<PartnerFilter>('todos');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const visiblePartners =
    filter === 'todos' ? data.partners : data.partners.filter((partner) => partner.category === filter);

  return {
    ...navigation,
    section: PARCEIROS_SECTION,
    data,
    filter,
    setFilter,
    visiblePartners,
    selectedPartner,
    openPartner: setSelectedPartner,
    closePartner: () => setSelectedPartner(null),
  };
}
