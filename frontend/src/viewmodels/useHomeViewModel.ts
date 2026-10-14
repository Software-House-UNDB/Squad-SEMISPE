import { useState, useCallback, useEffect } from 'react';
import { MAIN_NAV_ITEMS, TREE_ROOT_SECTION_IDS, type NavItem } from '../models/navigation.model';
import { type AboutSectionData } from '../models/about.model';

export const DEFAULT_ABOUT_DATA: AboutSectionData = {
  badge: 'ECOSSISTEMA DE INOVAÇÃO',
  title: 'Conectando talentos, ciência e o futuro de São Luís',
  subtitle: 'O Parque Tecnológico articula a Quádrupla Hélice para transformar a matriz socioeconômica da nossa cidade através de tecnologia, inovação aberta e sustentabilidade.',
  paragraphs: [
    'Instalado no histórico Trapiche Santo Ângelo, no coração do Centro Histórico de São Luís, o Parque Tecnológico é a ponte entre pesquisa científica de ponta e o mercado produtivo.',
    'Oferecemos infraestrutura de ponta, conexão com editais municipais de fomento, mentorias e programas de incubação para startups e pesquisadores transformarem ideias em soluções de impacto.'
  ],
  resultsTitle: 'Resultados',
  resultsSubtitle: 'Impacto direto gerado pelo ecossistema do Parque Tecnológico na economia e na sociedade maranhense.',
  metrics: [
    {
      id: 'metric-startups',
      value: '+XX',
      label: 'Startups Incubadas',
      description: 'Negócios inovadores residentes e acelerados com mentoria especializada.',
      
    },
    {
      id: 'metric-parceiros',
      value: '+XX',
      label: 'Parceiros Estratégicos',
      description: 'Universidades, empresas consolidadas, investidores e órgãos de fomento.',
      
    },
    {
      id: 'metric-eventos',
      value: '+XX',
      label: 'Eventos Realizados',
      description: 'Meetups, workshops, hackathons e palestras no Trapiche Santo Ângelo.',
      
    },
    {
      id: 'metric-projetos',
      value: '+XX',
      label: 'Projetos Apoiados',
      description: 'Iniciativas científicas e tecnológicas alavancadas por editais públicos.',
      
    },
    {
      id: 'metric-impactadas',
      value: '+XXX',
      label: 'Pessoas Impactadas',
      description: 'Estudantes, pesquisadores, empreendedores e cidadãos capacitados.',
      
    }
  ]
};

const TREE_BRANCH_ITEMS = MAIN_NAV_ITEMS.filter((item) => !TREE_ROOT_SECTION_IDS.includes(item.id));
/** Rótulo de cada seção por id, para as pílulas de abertura das seções */
const SECTION_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  MAIN_NAV_ITEMS.map((item) => [item.id, item.label])
);
const TREE_ROOT_ITEMS = MAIN_NAV_ITEMS.filter((item) => TREE_ROOT_SECTION_IDS.includes(item.id));

const INTRO_SECTION_ID = 'intro';
/** Rolagem (px) a partir da qual a navbar recolhe para dar a tela à árvore */
const NAVBAR_HIDE_SCROLL_OFFSET = 24;
/** A navbar volta quando a base da introdução chega a esta distância (px) do topo */
const NAVBAR_REVEAL_OFFSET = 96;

export interface HomeViewModel {
  navItems: readonly NavItem[];
  /** Seções exibidas como galhos da árvore da introdução */
  treeBranches: readonly NavItem[];
  /** Seções exibidas como raízes da árvore da introdução */
  treeRoots: readonly NavItem[];
  /** Rótulo de cada seção por id (o mesmo texto dos galhos/raízes e do menu) */
  sectionLabels: Readonly<Record<string, string>>;
  aboutData: AboutSectionData;
  activeSection: string;
  isMobileMenuOpen: boolean;
  /** Verdadeiro enquanto a introdução (árvore) ocupa a tela e a navbar fica recolhida */
  isNavbarHidden: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  onNavigateToSection: (href: string, sectionId: string) => void;
  onReservaClick: () => void;
}

export function useHomeViewModel(): HomeViewModel {
  const [activeSection, setActiveSection] = useState<string>('quem-somos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isPastTop, setIsPastTop] = useState<boolean>(false);
  const [isIntroOnScreen, setIsIntroOnScreen] = useState<boolean>(true);

  // A navbar aparece no topo da página, recolhe enquanto a árvore ocupa a tela
  // e volta (fixa) assim que a introdução termina de sair pela parte de cima
  useEffect(() => {
    const intro = document.getElementById(INTRO_SECTION_ID);
    if (!intro) {
      setIsIntroOnScreen(false);
      return;
    }

    const update = () => {
      setIsPastTop(window.scrollY > NAVBAR_HIDE_SCROLL_OFFSET);
      setIsIntroOnScreen(intro.getBoundingClientRect().bottom > NAVBAR_REVEAL_OFFSET);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const isNavbarHidden = isPastTop && isIntroOnScreen && !isMobileMenuOpen;

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const onNavigateToSection = useCallback((href: string, sectionId: string) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);

    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const onReservaClick = useCallback(() => {
    const reservaAnchor = document.getElementById('reserva-cta');
    if (reservaAnchor) {
      reservaAnchor.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Quando a rota de reserva estiver pronta, aqui faremos o navigate('/reserva')
      alert('Fluxo de Reserva de Espaços do Parque Tecnológico');
    }
  }, []);

  return {
    navItems: MAIN_NAV_ITEMS,
    treeBranches: TREE_BRANCH_ITEMS,
    treeRoots: TREE_ROOT_ITEMS,
    sectionLabels: SECTION_LABELS,
    aboutData: DEFAULT_ABOUT_DATA,
    activeSection,
    isMobileMenuOpen,
    isNavbarHidden,
    toggleMobileMenu,
    closeMobileMenu,
    onNavigateToSection,
    onReservaClick,
  };
}
