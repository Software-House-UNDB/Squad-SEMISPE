import { BRAND_ACCENTS, type SectionAccent } from './brand.model';

export interface NavItem {
  id: string;
  label: string;
  /** '/#secao' rola até uma seção da home; '/rota' abre outra página */
  href: string;
  /** Cor de identidade da seção: cada tópico usa uma cor do logotipo */
  accent: SectionAccent;
  isExternal?: boolean;
}

export const MAIN_NAV_ITEMS: readonly NavItem[] = [
  { id: 'quem-somos', label: 'QUEM SOMOS', href: '/quem-somos', accent: BRAND_ACCENTS.azul },
  { id: 'indicadores', label: 'INDICADORES', href: '/#indicadores', accent: BRAND_ACCENTS.verde },
  { id: 'estrutura', label: 'ESTRUTURA', href: '/estrutura', accent: BRAND_ACCENTS.amareloClaro },
  { id: 'parceiros', label: 'PARCEIROS', href: '/#parceiros', accent: BRAND_ACCENTS.verdeClaro },
  { id: 'eventos', label: 'EVENTOS', href: '/#eventos', accent: BRAND_ACCENTS.verdeOliva },
  { id: 'contato', label: 'CONTATO', href: '/#contato', accent: BRAND_ACCENTS.verdePetroleo },
] as const;

/** Seções representadas pelas raízes da árvore de partículas; as demais viram galhos */
export const TREE_ROOT_SECTION_IDS: readonly string[] = ['quem-somos', 'parceiros'];
