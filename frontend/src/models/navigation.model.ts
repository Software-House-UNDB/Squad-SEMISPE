export interface NavItem {
  id: string;
  label: string;
  href: string;
  isExternal?: boolean;
}

export const MAIN_NAV_ITEMS: readonly NavItem[] = [
  { id: 'quem-somos', label: 'QUEM SOMOS', href: '#quem-somos' },
  { id: 'indicadores', label: 'INDICADORES', href: '#indicadores' },
  { id: 'estrutura', label: 'ESTRUTURA', href: '#estrutura' },
  { id: 'parceiros', label: 'PARCEIROS', href: '#parceiros' },
  { id: 'eventos', label: 'EVENTOS', href: '#eventos' },
  { id: 'contato', label: 'CONTATO', href: '#contato' },
] as const;

/** Seções representadas pelas raízes da árvore de partículas; as demais viram galhos */
export const TREE_ROOT_SECTION_IDS: readonly string[] = ['quem-somos', 'parceiros'];
