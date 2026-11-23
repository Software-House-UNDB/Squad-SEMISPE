import { useState, useCallback, useEffect, useMemo } from 'react';
import { usePartners, type PartnersViewModel } from './usePartners';
import { useLocation } from 'react-router-dom';
import { MAIN_NAV_ITEMS, TREE_ROOT_SECTION_IDS, type NavItem } from '../models/navigation.model';
import { useSiteNavigation } from './useSiteNavigation';
import { type AboutSectionData } from '../models/about.model';
import { type EventHighlight } from '../models/event.model';
import { BRAND_ACCENTS } from '../models/brand.model';
import photoJornadaInova from '../assets/photos/eventos/jornada-inova-sao-luis-plateia.webp';
import photoForum from '../assets/photos/eventos/forum-cidades-digitais-plateia.webp';
import photoLancamento from '../assets/photos/eventos/inauguracao-parque-painel.webp';
import photoGameJam from '../assets/photos/eventos/global-game-jam-2026-participantes.webp';
import photoHackathon from '../assets/photos/eventos/hackathon-do-mercado-equipes.webp';

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

// Eventos realizados, do mais recente ao mais antigo, com as fotos enviadas pela
// SEMISPE (datas tiradas das próprias fotos e dos banners dos eventos)
export const DEFAULT_EVENT_HIGHLIGHTS: EventHighlight[] = [
  {
    id: 'evento-jornada-inova',
    title: 'Jornada Inova São Luís',
    date: '19/09/2026',
    category: 'Capacitação',
    accent: BRAND_ACCENTS.verde,
    image: photoJornadaInova,
    imageAlt: 'Plateia acompanha uma palestra da Jornada Inova São Luís',
  },
  {
    id: 'evento-forum-cidades',
    title: 'Fórum de Cidades Digitais e Inteligentes',
    date: '20/08/2026',
    category: 'Fórum',
    accent: BRAND_ACCENTS.azul,
    image: photoForum,
    imageAlt: 'Plateia do Fórum de Cidades Digitais e Inteligentes',
  },
  {
    id: 'evento-lancamento',
    title: 'Lançamento do Parque Tecnológico',
    date: '17/03/2026',
    category: 'Lançamento',
    accent: BRAND_ACCENTS.amarelo,
    image: photoLancamento,
    imageAlt: 'Painel de convidados no palco do lançamento do Parque Tecnológico de São Luís',
  },
  {
    id: 'evento-global-game-jam',
    title: 'Global Game Jam 2026',
    date: '30/01 a 01/02/2026',
    category: 'Game Jam',
    accent: BRAND_ACCENTS.verdePetroleo,
    image: photoGameJam,
    imageAlt: 'Participantes da Global Game Jam 2026 reunidos no Parque Tecnológico',
  },
  {
    id: 'evento-hackathon-mercado',
    title: 'Hackathon do Mercado',
    date: '20 e 21/01/2026',
    category: 'Hackathon',
    accent: BRAND_ACCENTS.verdeOliva,
    image: photoHackathon,
    imageAlt: 'Equipes programam em seus notebooks durante o Hackathon do Mercado',
  },
];

/** Itens do menu que não viram galho da árvore da introdução */
const TREE_EXCLUDED_SECTION_IDS: readonly string[] = ['banco-de-ideias', 'ar'];
const TREE_BRANCH_ITEMS = MAIN_NAV_ITEMS.filter(
  (item) => !TREE_EXCLUDED_SECTION_IDS.includes(item.id) && !TREE_ROOT_SECTION_IDS.includes(item.id)
);
/** Cada seção por id, para as pílulas de abertura (rótulo e cor de identidade) */
const SECTIONS: Readonly<Record<string, NavItem>> = Object.fromEntries(
  MAIN_NAV_ITEMS.map((item) => [item.id, item])
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
  /** Cada seção por id (o mesmo rótulo e cor dos galhos/raízes e do menu) */
  sections: Readonly<Record<string, NavItem>>;
  aboutData: AboutSectionData;
  /** Parceiros do Parque (seção Parceiros e o card "Parceiros Estratégicos" de Indicadores) */
  partners: PartnersViewModel;
  /** Slides do carrossel de eventos */
  eventHighlights: readonly EventHighlight[];
  activeSection: string;
  isMobileMenuOpen: boolean;
  /** Verdadeiro enquanto a introdução (árvore) ocupa a tela e a navbar fica recolhida */
  isNavbarHidden: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  onNavigateToSection: (href: string, sectionId: string) => void;
  /** "Saiba mais" do resumo: abre a página Quem Somos completa */
  onQuemSomosClick: () => void;
}

export function useHomeViewModel(): HomeViewModel {
  // Ao entrar, nenhuma seção fica ativa no menu (a tela é da introdução); vindo de
  // outra página por um link de seção (ex.: /#indicadores), fica ativa a dela
  const { hash } = useLocation();
  const [activeSection, setActiveSection] = useState<string>(() => hash.slice(1));
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

  const navigateTo = useSiteNavigation();

  // Vindo de outra página, a home abre na seção do link (/#indicadores) ou no topo,
  // na introdução (/), e não na altura em que a página anterior estava rolada
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [hash]);

  const onNavigateToSection = useCallback((href: string, sectionId: string) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
    navigateTo(href);
  }, [navigateTo]);

  const onQuemSomosClick = useCallback(() => navigateTo('/quem-somos'), [navigateTo]);

  // O card "Parceiros Estratégicos" mostra quantos parceiros há de fato e leva à seção Parceiros
  const partners = usePartners();
  const aboutData = useMemo<AboutSectionData>(
    () => ({
      ...DEFAULT_ABOUT_DATA,
      metrics: DEFAULT_ABOUT_DATA.metrics.map((metric) =>
        metric.id === 'metric-parceiros'
          ? {
              ...metric,
              value: partners.isLoading ? '…' : String(partners.total),
              link: { href: '#parceiros', label: 'Ver parceiros' },
            }
          : metric
      ),
    }),
    [partners.isLoading, partners.total]
  );

  return {
    navItems: MAIN_NAV_ITEMS,
    treeBranches: TREE_BRANCH_ITEMS,
    treeRoots: TREE_ROOT_ITEMS,
    sections: SECTIONS,
    aboutData,
    partners,
    eventHighlights: DEFAULT_EVENT_HIGHLIGHTS,
    activeSection,
    isMobileMenuOpen,
    isNavbarHidden,
    toggleMobileMenu,
    closeMobileMenu,
    onNavigateToSection,
    onQuemSomosClick,
  };
}
