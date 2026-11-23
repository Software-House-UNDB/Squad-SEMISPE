import { useCallback, useState } from 'react';
import { MAIN_NAV_ITEMS, type NavItem } from '../models/navigation.model';
import { useSiteNavigation } from './useSiteNavigation';

export interface PageNavigationViewModel {
  navItems: readonly NavItem[];
  activeSection: string;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  onNavigateToSection: (href: string, sectionId: string) => void;
}

/** Estado do menu nas páginas internas (fora da home): item ativo e menu do celular */
export function usePageNavigation(activeSection: string): PageNavigationViewModel {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigateTo = useSiteNavigation();

  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((previous) => !previous), []);
  const onNavigateToSection = useCallback(
    (href: string) => {
      setIsMobileMenuOpen(false);
      navigateTo(href);
    },
    [navigateTo]
  );

  return { navItems: MAIN_NAV_ITEMS, activeSection, isMobileMenuOpen, toggleMobileMenu, onNavigateToSection };
}
