import { useCallback, useState } from 'react';
import { MAIN_NAV_ITEMS, type NavItem } from '../models/navigation.model';
import { BRAND_ACCENTS } from '../models/brand.model';
import { type QuemSomosContent } from '../models/quemSomos.model';
import { PARQUE_ADDRESS } from './useEstruturaViewModel';
import { useSiteNavigation } from './useSiteNavigation';
import photoLancamento from '../assets/photos/eventos/inauguracao-parque-equipe.webp';
import photoGameJam from '../assets/photos/eventos/global-game-jam-2026-apresentacao.webp';
import photoJornadaInova from '../assets/photos/eventos/jornada-inova-sao-luis-palestra.webp';
import photoHackathonMentoria from '../assets/photos/eventos/hackathon-do-mercado-mentoria.webp';
import photoForum from '../assets/photos/eventos/forum-cidades-digitais-palco.webp';
import photoEspaco from '../assets/photos/eventos/jornada-inova-sao-luis-espaco.webp';
import logoPortoDigital from '../assets/partners/porto-digital.png';
import logoCasaAzul from '../assets/partners/casa-azul-ventures.png';
import logoUndb from '../assets/partners/undb.png';
import logoIfma from '../assets/partners/ifma.png';

/**
 * Conteúdo da página Quem Somos. Datas, números, programas e acordos vêm das notícias
 * oficiais da Prefeitura sobre o lançamento do Parque (17/03/2026) e a entrega do
 * Trapiche Santo Ângelo (28/11/2025), no portal saoluis.ma.gov.br.
 *
 * PROVISÓRIO: a SEMISPE ainda não publicou missão, visão e valores. Os textos de
 * `statements` e `values` são um rascunho escrito a partir das falas oficiais do
 * lançamento e precisam ser validados pela SEMISPE antes de ir ao ar.
 */
export const QUEM_SOMOS_CONTENT: QuemSomosContent = {
  intro: {
    title: 'Inovação que nasce no',
    titleHighlight: 'coração histórico de São Luís',
    lead:
      'O Parque Tecnológico de São Luís é o ambiente de inovação da Prefeitura, gerido pela Secretaria Municipal de Inovação, Sustentabilidade e Projetos Especiais (SEMISPE). Conectamos governo, universidades, empresas, startups e sociedade para transformar ideias em soluções para a cidade.',
    history:
      'Nossa casa é o Complexo Trapiche Santo Ângelo, conjunto de galpões erguido entre o fim do século XIX e o início do XX na antiga área portuária da Praia Grande, onde funcionou a primeira prensa industrial de algodão do Maranhão. Restaurado pela Prefeitura e entregue em 28 de novembro de 2025, o complexo recebeu o lançamento do Parque em 17 de março de 2026.',
    photo: {
      src: photoLancamento,
      alt: 'Equipe e convidados no palco do lançamento do Parque Tecnológico de São Luís, diante do painel "A transformação começa aqui e agora"',
      caption: 'Lançamento do Parque · 17/03/2026',
    },
    facts: [
      { id: 'gestao', label: 'Gestão', value: 'SEMISPE · Prefeitura de São Luís', accent: BRAND_ACCENTS.azul },
      { id: 'sede', label: 'Sede', value: `${PARQUE_ADDRESS.place}, Trapiche Santo Ângelo`, accent: BRAND_ACCENTS.verde },
      { id: 'lancamento', label: 'Lançamento', value: '17 de março de 2026', accent: BRAND_ACCENTS.verdePetroleo },
    ],
    anchors: [
      { id: 'missao', label: 'Missão, visão e valores', accent: BRAND_ACCENTS.azul },
      { id: 'atuacao', label: 'Atuação e metas', accent: BRAND_ACCENTS.verde },
      { id: 'espacos', label: 'Nossos espaços', accent: BRAND_ACCENTS.amareloClaro },
    ],
  },

  statements: [
    {
      id: 'missao',
      title: 'Missão',
      text: 'Fortalecer o ecossistema de inovação de São Luís, estimulando o empreendedorismo tecnológico, formando talentos e desenvolvendo soluções para os desafios da cidade.',
      accent: BRAND_ACCENTS.azul,
    },
    {
      id: 'visao',
      title: 'Visão',
      text: 'Ser referência no Nordeste como ambiente de inovação e laboratório de soluções para a cidade, reconhecido por transformar conhecimento em oportunidades para quem vive em São Luís.',
      accent: BRAND_ACCENTS.verde,
    },
  ],

  values: [
    {
      id: 'colaboracao',
      title: 'Colaboração',
      description: 'Poder público, universidades, empresas, sociedade civil e meio ambiente construindo juntos.',
      accent: BRAND_ACCENTS.azul,
    },
    {
      id: 'inovacao',
      title: 'Inovação com propósito',
      description: 'Tecnologia a serviço dos desafios reais da cidade e das pessoas.',
      accent: BRAND_ACCENTS.verde,
    },
    {
      id: 'sustentabilidade',
      title: 'Sustentabilidade',
      description: 'Desenvolvimento que respeita o meio ambiente e as próximas gerações.',
      accent: BRAND_ACCENTS.verdePetroleo,
    },
    {
      id: 'inclusao',
      title: 'Inclusão',
      description: 'Portas abertas para formar talentos e dar oportunidade a quem quer empreender.',
      accent: BRAND_ACCENTS.verdeOliva,
    },
    {
      id: 'patrimonio',
      title: 'Valorização de São Luís',
      description: 'Inovação que nasce no Centro Histórico e fortalece a identidade da cidade.',
      accent: BRAND_ACCENTS.amarelo,
    },
  ],

  // Os cinco pilares são as cinco hélices citadas pela Prefeitura no lançamento,
  // com nomes mais próximos do visitante ("Instituições de ensino" inclui o IFMA).
  bridge: {
    title: 'Uma ponte entre ideias e a cidade',
    text: 'O ecossistema de inovação é a ponte que leva o conhecimento até as soluções de que São Luís precisa. Ela se sustenta em cinco pilares.',
    note: 'Inspirado no modelo de quíntupla hélice da inovação.',
    from: 'Ideias e conhecimento',
    to: 'Soluções para a cidade',
    pillars: [
      {
        id: 'poder-publico',
        label: 'Poder público',
        description: 'Cria políticas, investe e abre a cidade como laboratório de soluções.',
        accent: BRAND_ACCENTS.azul,
      },
      {
        id: 'ensino',
        label: 'Instituições de ensino',
        description: 'Formam talentos e levam a pesquisa para a prática.',
        accent: BRAND_ACCENTS.amarelo,
      },
      {
        id: 'empresas',
        label: 'Empresas',
        description: 'Investem, contratam e transformam ideias em negócios.',
        accent: BRAND_ACCENTS.verdePetroleo,
      },
      {
        id: 'pessoas',
        label: 'Pessoas',
        description: 'Apontam os desafios do dia a dia e são o motivo de cada solução.',
        accent: BRAND_ACCENTS.verdeOliva,
      },
      {
        id: 'meio-ambiente',
        label: 'Meio ambiente',
        description: 'Garante que cada solução respeite a cidade e as próximas gerações.',
        accent: BRAND_ACCENTS.verde,
      },
    ],
  },

  programs: [
    {
      id: 'maratonas',
      title: 'Maratonas de inovação',
      description: 'Hackathons e game jams em que equipes criam, em poucos dias, soluções e produtos para desafios reais.',
      accent: BRAND_ACCENTS.azul,
      photo: {
        src: photoGameJam,
        alt: 'Participante apresenta o jogo Fofão Mania na Global Game Jam 2026, no Parque Tecnológico',
        caption: 'Global Game Jam · jan/2026',
      },
    },
    {
      id: 'formacao',
      title: 'Formação profissional',
      description: 'Cursos, oficinas e palestras que preparam jovens e empreendedores para a economia digital.',
      accent: BRAND_ACCENTS.verde,
      photo: {
        src: photoJornadaInova,
        alt: 'Plateia acompanha uma palestra para empreendedores na Jornada Inova São Luís',
        caption: 'Jornada Inova São Luís · set/2026',
      },
    },
    {
      id: 'incubacao',
      title: 'Incubação, aceleração e mentorias',
      description: 'Apoio a startups e novos negócios, da ideia ao mercado, com mentorias especializadas e programas de aceleração.',
      accent: BRAND_ACCENTS.verdePetroleo,
      photo: {
        src: photoHackathonMentoria,
        alt: 'Mentores conversam com uma equipe à mesa durante o Hackathon do Mercado',
        caption: 'Hackathon do Mercado · jan/2026',
      },
    },
    {
      id: 'conexao',
      title: 'Conexão com o ecossistema',
      description: 'Encontros que aproximam startups, investidores, universidades e poder público.',
      accent: BRAND_ACCENTS.verdeOliva,
      photo: {
        src: photoForum,
        alt: 'Autoridades no palco do Fórum de Cidades Digitais e Inteligentes, diante da plateia',
        caption: 'Fórum de Cidades Digitais · ago/2026',
      },
    },
  ],

  goals: [
    { id: 'cidadaos', value: '30', unit: 'mil', label: 'cidadãos alcançados', accent: BRAND_ACCENTS.azul },
    { id: 'negocios', value: '1.100', label: 'negócios beneficiados', accent: BRAND_ACCENTS.verde },
    { id: 'jovens', value: '500', label: 'jovens formados em tecnologia', accent: BRAND_ACCENTS.verdePetroleo },
    {
      id: 'investimento',
      value: 'R$ 50',
      unit: 'mi',
      label: 'investidos pela Prefeitura em inovação, de 2026 a 2029',
      accent: BRAND_ACCENTS.amarelo,
    },
  ],

  agreements: [
    {
      id: 'porto-digital',
      partner: 'Porto Digital',
      origin: 'Recife (PE)',
      description: 'Protocolo de intenções para troca de experiências e metodologias.',
      logo: logoPortoDigital,
    },
    {
      id: 'casa-azul',
      partner: 'Casa Azul Ventures',
      origin: 'Fortaleza (CE)',
      description: 'Cooperação técnica em aceleração de startups e conexão com investidores.',
      logo: logoCasaAzul,
    },
    {
      id: 'undb',
      partner: 'Centro Universitário UNDB',
      origin: 'São Luís (MA)',
      description: 'Cooperação técnica em soluções digitais inovadoras.',
      logo: logoUndb,
    },
    {
      id: 'ifma',
      partner: 'IFMA',
      origin: 'Maranhão',
      description: 'Convênio para apoiar startups e iniciativas de inovação.',
      logo: logoIfma,
    },
  ],

  estrutura: {
    title: 'Conheça nossos espaços',
    text: 'Salas de reunião, espaço multiuso e miniauditório no Trapiche Santo Ângelo, abertos para reuniões, eventos e atividades do ecossistema de inovação.',
    photo: {
      src: photoEspaco,
      alt: 'Galpão do Parque Tecnológico montado com cadeiras e recepção para a Jornada Inova São Luís',
    },
  },
};

const QUEM_SOMOS_SECTION = MAIN_NAV_ITEMS.find((item) => item.id === 'quem-somos')!;
const ESTRUTURA_SECTION = MAIN_NAV_ITEMS.find((item) => item.id === 'estrutura')!;

export interface QuemSomosViewModel {
  navItems: readonly NavItem[];
  activeSection: string;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  onNavigateToSection: (href: string, sectionId: string) => void;
  /** Seção do menu representada pela página (rótulo e cor de identidade) */
  section: NavItem;
  /** Seção da Estrutura, para a chamada final */
  estruturaSection: NavItem;
  content: QuemSomosContent;
  /** Rotas da chamada final: espaços e reserva */
  espacosHref: string;
  reservaHref: string;
}

export function useQuemSomosViewModel(): QuemSomosViewModel {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const navigateTo = useSiteNavigation();

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const onNavigateToSection = useCallback((href: string) => {
    setIsMobileMenuOpen(false);
    navigateTo(href);
  }, [navigateTo]);

  return {
    navItems: MAIN_NAV_ITEMS,
    activeSection: QUEM_SOMOS_SECTION.id,
    isMobileMenuOpen,
    toggleMobileMenu,
    onNavigateToSection,
    section: QUEM_SOMOS_SECTION,
    estruturaSection: ESTRUTURA_SECTION,
    content: QUEM_SOMOS_CONTENT,
    espacosHref: '/estrutura',
    reservaHref: '/estrutura/reserva',
  };
}
